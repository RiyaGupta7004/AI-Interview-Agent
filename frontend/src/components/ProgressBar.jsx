import { motion } from "framer-motion";

function ProgressBar({ currentQuestion, totalQuestions }) {
  const progress = (currentQuestion / totalQuestions) * 100;

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
        <span className="font-medium">Question {currentQuestion} of {totalQuestions}</span>
        <span>{Math.round(progress)}%</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800/80 shadow-inner shadow-slate-950/50">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
