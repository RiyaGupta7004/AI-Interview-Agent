import { motion } from "framer-motion";

function ChatMessage({ sender, text, timestamp }) {
  const isAi = sender === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex ${isAi ? "justify-start" : "justify-end"}`}
    >
      <div className={`max-w-[80%] ${isAi ? "items-start" : "items-end"} flex flex-col`}>
        <div className="mb-1.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">
          <span>{isAi ? "AI" : "You"}</span>
          <span className="h-px flex-1 bg-slate-700/80" />
          <span>{timestamp}</span>
        </div>

        <div
          className={[
            "rounded-2xl border px-4 py-3 shadow-lg",
            isAi
              ? "border-slate-700/80 bg-slate-800/90 text-slate-100 shadow-slate-950/30"
              : "border-cyan-300/30 bg-cyan-400 text-slate-950 shadow-cyan-500/20",
          ].join(" ")}
        >
          <p className="text-sm leading-7 sm:text-[15px]">{text}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default ChatMessage;
