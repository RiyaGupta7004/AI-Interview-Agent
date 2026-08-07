import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import InterviewHeader from "../components/InterviewHeader.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import ChatMessage from "../components/ChatMessage.jsx";
import TypingIndicator from "../components/TypingIndicator.jsx";
import InterviewSidebar from "../components/InterviewSidebar.jsx";

const interviewQuestions = [
  "Tell me what Retrieval-Augmented Generation is.",
  "How would you improve a prompt for better reasoning and structure?",
  "What are the tradeoffs between vector databases and traditional relational storage for AI workloads?",
  "Describe how an AI agent differs from a simple LLM call.",
  "What is MCP and why does it matter in modern AI systems?",
  "How do large language models reason, and where do they fail?",
  "When would you choose fine-tuning over prompt engineering?",
  "How would you deploy an AI feature into production responsibly?",
];

function InterviewPage() {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: interviewQuestions[0],
      timestamp: "09:14",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const currentQuestionNumber = currentQuestionIndex + 1;
  const remainingQuestions = interviewQuestions.length - currentQuestionNumber;

  const progressLabel = useMemo(
    () => `Question ${currentQuestionNumber} of ${interviewQuestions.length}`,
    [currentQuestionNumber]
  );

  const handleSendMessage = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: trimmed,
      timestamp,
    };

    const nextIndex = currentQuestionIndex + 1;
    const nextQuestion = interviewQuestions[nextIndex];

    setAnswers((prev) => [...prev, trimmed]);
    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setIsTyping(true);

    setTimeout(() => {
      if (nextQuestion) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "ai",
            text: nextQuestion,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
        setCurrentQuestionIndex(nextIndex);
      } else {
        navigate("/results", { replace: true });
      }

      setIsTyping(false);
    }, 600);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <InterviewHeader />

        <div className="mb-6">
          <ProgressBar
            currentQuestion={currentQuestionNumber}
            totalQuestions={interviewQuestions.length}
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
                    onClick={handleSendMessage}
                    className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
                  >
                    Send
                  </motion.button>
                </div>
              </div>
            </div>
          </main>

          <InterviewSidebar />
        </div>
      </div>
    </div>
  );
}

export default InterviewPage;
