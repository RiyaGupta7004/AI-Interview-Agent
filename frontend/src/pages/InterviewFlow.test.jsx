import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LandingPage from "./LandingPage.jsx";
import InterviewPage from "./InterviewPage.jsx";
import ResultsPage from "./ResultsPage.jsx";
import ChatMessage from "../components/ChatMessage.jsx";

const { apiGet, apiPost } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("../services/api.js", () => ({
  default: { get: apiGet, post: apiPost },
  getApiErrorMessage: (error, fallback) => error?.response?.data?.message || fallback,
}));

function LocationState() {
  const location = useLocation();
  return <output>{location.state?.candidateId || "No candidate selected"}</output>;
}

describe("candidate selection and interview lifecycle", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
  });

  it("renders AI-generated markup as inert text", () => {
    const generatedMarkup = '<img src=x onerror="alert(1)">';
    render(<ChatMessage sender="ai" text={generatedMarkup} timestamp="10:00" />);

    expect(screen.getByText(generatedMarkup)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("loads candidates, exposes selection state, and starts with the selected candidate", async () => {
    const user = userEvent.setup();
    apiGet.mockResolvedValue({
      data: {
        candidates: [
          { id: "CAND-001", name: "Sarah Johnson", role: "Engineer", experience: 4 },
          { id: "CAND-002", name: "Alex Turner", role: "AI Engineer", experience: 5 },
        ],
      },
    });

    render(
      <MemoryRouter initialEntries={["/"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/interview" element={<LocationState />} />
        </Routes>
      </MemoryRouter>
    );

    const alex = await screen.findByRole("button", {
      name: "Alex Turner, AI Engineer, 5 years experience",
    });
    await user.click(alex);
    expect(alex).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /Start Interview · Alex Turner/ }));
    expect(await screen.findByText("CAND-002")).toBeInTheDocument();
  });

  it("sends an answer, advances the adaptive chat, and renders the completion report", async () => {
    const user = userEvent.setup();
    apiPost
      .mockResolvedValueOnce({
        data: {
          success: true,
          sessionId: "6f11e28e-bca7-4af4-a6e3-1a2c01b2c3d4",
          candidateName: "Emily Chen",
          message: "Welcome. Tell me about your experience.",
          currentQuestion: { topic: "Embeddings" },
          interviewState: { currentQuestionIndex: 0, totalQuestions: 8, completed: false },
          progress: { current: 1, total: 8 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          sessionId: "6f11e28e-bca7-4af4-a6e3-1a2c01b2c3d4",
          message: "How would you measure retrieval quality?",
          nextQuestion: { topic: "Vector Search" },
          interviewState: { currentQuestionIndex: 1, totalQuestions: 8, completed: false },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          message: "Thank you. The interview is complete.",
          nextQuestion: null,
          interviewState: { currentQuestionIndex: 7, totalQuestions: 8, completed: true },
          report: {
            candidate: { id: "CAND-003", name: "Emily Chen" },
            interview: { overallScore: 82, overallLevel: "Advanced" },
            scores: { technical: 84, reasoning: 80, communication: 82, confidence: 82 },
            strengths: ["Embeddings"],
            weaknesses: [],
            topicBreakdown: [],
            recommendations: [],
            hiringRecommendation: "Strong Hire",
            summary: "Strong structured interview performance.",
          },
        },
      });

    render(
      <MemoryRouter
        initialEntries={[{ pathname: "/interview", state: { candidateId: "CAND-003" } }]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/interview" element={<InterviewPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    const answerBox = await screen.findByRole("textbox", { name: "Your interview answer" });
    expect(answerBox).toHaveFocus();
    expect(screen.getByRole("log", { name: "Interview conversation" })).toHaveTextContent(
      "Welcome. Tell me about your experience."
    );

    await user.type(answerBox, "I would use embeddings to retrieve relevant context.");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("How would you measure retrieval quality?")).toBeInTheDocument();
    expect(apiPost).toHaveBeenNthCalledWith(2, "/api/interview/message", {
      sessionId: "6f11e28e-bca7-4af4-a6e3-1a2c01b2c3d4",
      message: "I would use embeddings to retrieve relevant context.",
    });

    await user.type(answerBox, "I would evaluate recall and relevance.");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("heading", { name: "Candidate Performance" })).toBeInTheDocument();
    expect(screen.getByText("Strong Hire")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("heading", { name: "Candidate Performance" })).toHaveFocus());
  });

  it("keeps the answer editable and announces a failed response", async () => {
    const user = userEvent.setup();
    apiPost
      .mockResolvedValueOnce({
        data: {
          success: true,
          sessionId: "6f11e28e-bca7-4af4-a6e3-1a2c01b2c3d4",
          message: "Opening question.",
          currentQuestion: { topic: "Embeddings" },
          interviewState: { currentQuestionIndex: 0, totalQuestions: 8 },
        },
      })
      .mockRejectedValueOnce({ response: { data: { message: "Please retry your answer." } } });

    render(
      <MemoryRouter
        initialEntries={[{ pathname: "/interview", state: { candidateId: "CAND-003" } }]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes><Route path="/interview" element={<InterviewPage />} /></Routes>
      </MemoryRouter>
    );

    const answerBox = await screen.findByRole("textbox", { name: "Your interview answer" });
    await user.type(answerBox, "My answer");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("log", { name: "Interview conversation" })).toHaveTextContent(
      "Please retry your answer."
    );
    expect(answerBox).toHaveValue("My answer");
  });
});
