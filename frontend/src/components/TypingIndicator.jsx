import { motion } from "framer-motion";

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl border border-slate-700/80 bg-slate-800/90 px-4 py-3 shadow-lg shadow-slate-950/30">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="h-2.5 w-2.5 rounded-full bg-cyan-300"
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
