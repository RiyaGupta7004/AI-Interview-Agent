import { motion } from "framer-motion";

function ChatMessage({ sender, text, timestamp }) {
  const isAi = sender === "ai";
  return (
    <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.25, ease: "easeOut" }} className={`flex ${isAi ? "justify-start" : "justify-end"}`} role="group" aria-label={`${isAi ? "Interviewer" : "You"}${timestamp ? ` at ${timestamp}` : ""}`}>
      <div className={`flex max-w-[88%] flex-col sm:max-w-[78%] ${isAi ? "items-start" : "items-end"}`}>
        <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.13em] text-slate-500">
          <span>{isAi ? <>Maya {"\u00b7"} Interviewer</> : "You"}</span>
          {timestamp ? <span aria-hidden="true" className="normal-case tracking-normal text-slate-600">{timestamp}</span> : null}
        </div>
        <div className={["rounded-2xl border px-4 py-3.5 shadow-sm", isAi ? "border-slate-700/80 bg-slate-800/80 text-slate-100" : "border-teal-300/30 bg-teal-300 text-slate-950"].join(" ")}>
          <p className="text-sm leading-7 sm:text-[15px]">{text}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default ChatMessage;
