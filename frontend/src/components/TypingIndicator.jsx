import { motion } from "framer-motion";

function TypingIndicator() {
  return (
    <div className="flex justify-start" role="status" aria-label="Interviewer is thinking">
      <div className="rounded-2xl border border-emerald-300/15 bg-[#10251d]/90 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-teal-300 shadow-[0_0_8px_rgba(45,212,191,.6)]"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: dot * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
