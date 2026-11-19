import { motion } from "framer-motion";

function ProgressBar({ currentQuestion, totalQuestions }) {
  const safeTotal = Math.max(0, Number(totalQuestions) || 0);
  const safeCurrent = safeTotal ? Math.min(Math.max(1, Number(currentQuestion) || 1), safeTotal) : 0;
  const progress = safeTotal ? (safeCurrent / safeTotal) * 100 : 0;

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold text-slate-200">
          {safeTotal ? `Question ${safeCurrent} of ${safeTotal}` : "Preparing interview"}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>

      <div
        className="h-1.5 overflow-hidden rounded-full bg-slate-800/90"
        role="progressbar"
        aria-label="Interview progress"
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuenow={safeCurrent}
        aria-valuetext={safeTotal ? `Question ${safeCurrent} of ${safeTotal}` : "Preparing interview"}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-300"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
