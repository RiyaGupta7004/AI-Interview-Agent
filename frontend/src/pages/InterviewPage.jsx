import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import api from "../services/api.js";
import InterviewHeader from "../components/InterviewHeader.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import ChatMessage from "../components/ChatMessage.jsx";
import TypingIndicator from "../components/TypingIndicator.jsx";
import InterviewSidebar from "../components/InterviewSidebar.jsx";

const DEFAULT_CANDIDATE_ID = "CAND-003";

const createTimestamp = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

function InterviewPage() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState("Starting interview...");
  const [topic, setTopic] = useState("Loading...");
  const [progress, setProgress] = useState({ current: 1, total: 1 });
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [questionsRemaining, setQuestionsRemaining] = useState(0);

  const progressLabel = useMemo(() => {
    if (!progress.total) {
      return "Preparing interview...";
    }

    return `Question ${Math.max(currentQuestionNumber, progress.current || 1)} of ${progress.total}`;
  }, [currentQuestionNumber, progress]);

  const startInterview = async () => {
    try {
      setIsTyping(true);
      setStatus("Starting interview...");

      const { data } = await api.post("/api/interview/start", {
        candidateId: DEFAULT_CANDIDATE_ID,
      });

      if (!data?.success) {
        throw new Error(data?.message || "Unable to start interview.");
      }

      const firstQuestion = data?.currentQuestion;
      const totalQuestions = Number(data?.progress?.total || 0);
      const currentProgress = Number(data?.progress?.current || 1);

      setSessionId(data.sessionId || "");
      setTopic(firstQuestion?.topic || "Interview Topic");
      setProgress({
        current: currentProgress,
        total: totalQuestions,
      });
      setCurrentQuestionNumber(currentProgress);
      setQuestionsRemaining(Math.max(totalQuestions - currentProgress, 0));
      setStatus("In Progress");
      setMessages([
        {
          id: Date.now(),
          sender: "ai",
          text: firstQuestion?.topic || "Tell me about your experience.",
          timestamp: createTimestamp(),
        },
      ]);
    } catch (error) {
      setStatus("Interview unavailable");
      setMessages([
        {
          id: Date.now(),
          sender: "ai",
          text: error?.message || "Unable to start the interview right now.",
          timestamp: createTimestamp(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    void startInterview();
  }, []);

  const handleSendMessage = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !sessionId) return;

    const timestamp = createTimestamp();
    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: trimmed,
      timestamp,
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setIsTyping(true);
    setStatus("Thinking...");

    try {
      const { data } = await api.post("/api/interview/message", {
        sessionId,
        message: trimmed,
      });

      if (!data?.success) {
        throw new Error(data?.message || "Unable to continue the interview.");
      }

      const nextQuestion = data?.nextQuestion;
      const aiMessage = data?.message || "Could you tell me a bit more about that?";
      const interviewState = data?.interviewState || {};
      const totalQuestions = Number(interviewState?.totalQuestions || progress.total || 0);
      const nextNumber = Math.max(1, Number(interviewState?.currentQuestionIndex ?? 0) + 1);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: aiMessage,
          timestamp: createTimestamp(),
        },
      ]);

      if (nextQuestion && nextQuestion.topic) {
        setTopic(nextQuestion.topic);
        setProgress({ current: nextNumber, total: totalQuestions });
        setCurrentQuestionNumber(nextNumber);
        setQuestionsRemaining(Math.max(totalQuestions - nextNumber, 0));
        setStatus("In Progress");
      } else {
        setStatus("Completed");
        setProgress({ current: totalQuestions, total: totalQuestions });
        setCurrentQuestionNumber(totalQuestions || 1);
        setQuestionsRemaining(0);
        navigate("/results", {
          replace: true,
          state: {
            ...data,
            status: "completed",
          },
        });
        return;
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: "ai",
          text: error?.message || "Sorry, something went wrong.",
          timestamp: createTimestamp(),
        },
      ]);
      setStatus("Interview unavailable");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <InterviewHeader />

        <div className="mb-6">
          <ProgressBar
            currentQuestion={Math.max(currentQuestionNumber, progress.current || 1)}
            totalQuestions={Math.max(progress.total || 1, 1)}
          />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <main className="flex-1 overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-slate-950/40 backdrop-blur-sm">
            <div className="flex h-[72vh] min-h-[540px] flex-col">
              <div className="flex items-center justify-between border-b border-slate-800/90 bg-slate-900/70 px-5 py-4 sm:px-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                    {progressLabel}
                  </p>
                </div>
                <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  Online
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(180deg,_rgba(15,23,42,0.8),_rgba(2,6,23,1))] px-4 py-5 sm:px-6">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    sender={message.sender}
                    text={message.text}
                    timestamp={message.timestamp}
                  />
                ))}

                {isTyping ? <TypingIndicator /> : null}
              </div>

              <div className="border-t border-slate-800 bg-slate-950/60 p-4 sm:p-5">
                <div className="flex items-end gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 p-3 shadow-inner shadow-slate-950/40">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Type your answer..."
                    className="max-h-32 min-h-[52px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  />

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => void handleSendMessage()}
                    className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
                  >
                    Send
                  </motion.button>
                </div>
              </div>
            </div>
          </main>

          <InterviewSidebar
            topic={topic}
            status={status}
            questionsRemaining={questionsRemaining}
          />
        </div>
      </div>
    </div>
  );
}

export default InterviewPage;
