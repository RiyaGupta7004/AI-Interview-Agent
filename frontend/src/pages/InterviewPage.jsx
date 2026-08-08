import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

import api, { getApiErrorMessage } from "../services/api.js";
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

let messageIdCounter = 0;
const createMessageId = () => {
  messageIdCounter += 1;
  return `${Date.now()}-${messageIdCounter}`;
};

/**
 * Derive display progress from backend interviewState (source of truth).
 * @param {object} interviewState
 * @param {object} [progressFallback]
 * @returns {{ current: number, total: number, remaining: number, completed: boolean }}
 */
function syncProgressFromBackend(interviewState = {}, progressFallback = {}) {
  const totalQuestions = Number(
    interviewState?.totalQuestions ?? progressFallback?.total ?? 0
  );
  const index = Number(interviewState?.currentQuestionIndex);

  const current = Number.isFinite(index)
    ? Math.max(1, index + 1)
    : Math.max(1, Number(progressFallback?.current || 1));

  return {
    current,
    total: totalQuestions,
    remaining: Math.max(totalQuestions - current, 0),
    completed: Boolean(interviewState?.completed),
  };
}

function InterviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const candidateId =
    location?.state?.candidateId ||
    new URLSearchParams(location.search).get("candidateId") ||
    DEFAULT_CANDIDATE_ID;

  const [sessionId, setSessionId] = useState("");
  const [candidateName, setCandidateName] = useState(location?.state?.candidateName || "");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState("Starting interview...");
  const [topic, setTopic] = useState("Loading...");
  const [progress, setProgress] = useState({ current: 1, total: 1 });
  const [questionsRemaining, setQuestionsRemaining] = useState(0);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const startedRef = useRef(false);
  const sendingRef = useRef(false);

  const progressLabel = useMemo(() => {
    if (!progress.total) {
      return "Preparing interview...";
    }

    return `Question ${Math.max(1, Number(progress.current || 1))} of ${progress.total}`;
  }, [progress]);

  const applyInterviewState = (data, fallbackTopic) => {
    const synced = syncProgressFromBackend(data?.interviewState, data?.progress);
    const nextTopic =
      data?.nextQuestion?.topic ||
      data?.currentQuestion?.topic ||
      fallbackTopic ||
      topic;

    setTopic(nextTopic || "Interview Topic");
    setProgress({
      current: synced.current,
      total: synced.total,
    });
    setQuestionsRemaining(synced.remaining);

    return synced;
  };

  const startInterview = async () => {
    try {
      setIsTyping(true);
      setStatus("Starting interview...");

      const { data } = await api.post("/api/interview/start", {
        candidateId,
      });

      if (!data?.success) {
        throw new Error(data?.message || "Unable to start interview.");
      }

      setSessionId(data.sessionId || "");
      setCandidateName(data.candidateName || candidateName || "");
      applyInterviewState(data, data?.currentQuestion?.topic);
      setStatus("In Progress");
      setMessages([
        {
          id: createMessageId(),
          sender: "ai",
          text:
            data?.message ||
            "Welcome to your AI interview. Could you briefly introduce yourself?",
          timestamp: createTimestamp(),
        },
      ]);
    } catch (error) {
      setStatus("Interview unavailable");
      setMessages([
        {
          id: createMessageId(),
          sender: "ai",
          text: getApiErrorMessage(error, "Unable to start the interview right now."),
          timestamp: createTimestamp(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void startInterview();
    // Start once per mount for the selected candidate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const frame = requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
      chatEndRef.current?.scrollIntoView({ block: "end" });
    });

    return () => cancelAnimationFrame(frame);
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !sessionId || isTyping || sendingRef.current) return;

    sendingRef.current = true;
    const timestamp = createTimestamp();
    const userMessage = {
      id: createMessageId(),
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

      const synced = applyInterviewState(data);
      const isComplete =
        !data?.nextQuestion ||
        Boolean(data?.interviewState?.completed) ||
        Boolean(data?.report);

      if (isComplete) {
        setStatus("Completed");
        setProgress({
          current: synced.total || progress.total,
          total: synced.total || progress.total,
        });
        setQuestionsRemaining(0);

        if (data?.message) {
          setMessages((prev) => [
            ...prev,
            {
              id: createMessageId(),
              sender: "ai",
              text: data.message,
              timestamp: createTimestamp(),
            },
          ]);
        }

        navigate("/results", {
          replace: true,
          state: {
            ...data,
            status: "completed",
          },
        });
        return;
      }

      const aiMessage = data?.message || "Could you tell me a bit more about that?";
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          sender: "ai",
          text: aiMessage,
          timestamp: createTimestamp(),
        },
      ]);
      setStatus("In Progress");
    } catch (error) {
      setDraft(trimmed);
      setMessages((prev) => {
        const withoutOptimisticUser = prev.filter((entry) => entry.id !== userMessage.id);
        return [
          ...withoutOptimisticUser,
          {
            id: createMessageId(),
            sender: "ai",
            text: getApiErrorMessage(error, "Sorry, something went wrong. Please try again."),
            timestamp: createTimestamp(),
          },
        ];
      });
      setStatus("In Progress");
    } finally {
      setIsTyping(false);
      sendingRef.current = false;
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
            currentQuestion={Math.max(1, Number(progress.current || 1))}
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

              <div
                ref={chatContainerRef}
                className="flex-1 space-y-5 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(180deg,_rgba(15,23,42,0.8),_rgba(2,6,23,1))] px-4 py-5 sm:px-6"
              >
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    sender={message.sender}
                    text={message.text}
                    timestamp={message.timestamp}
                  />
                ))}

                {isTyping ? <TypingIndicator /> : null}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t border-slate-800 bg-slate-950/60 p-4 sm:p-5">
                <div className="flex items-end gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 p-3 shadow-inner shadow-slate-950/40">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    disabled={isTyping || !sessionId}
                    placeholder="Type your answer..."
                    className="max-h-32 min-h-[52px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <motion.button
                    whileHover={isTyping || !sessionId || !draft.trim() ? undefined : { scale: 1.02 }}
                    whileTap={isTyping || !sessionId || !draft.trim() ? undefined : { scale: 0.98 }}
                    onClick={() => void handleSendMessage()}
                    disabled={isTyping || !sessionId || !draft.trim()}
                    className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
            candidateName={candidateName}
          />
        </div>
      </div>
    </div>
  );
}

export default InterviewPage;
