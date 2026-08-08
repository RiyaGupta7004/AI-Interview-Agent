import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const scoreMeta = [
  { key: "technical", label: "Technical", accent: "from-cyan-400 to-blue-500" },
  { key: "reasoning", label: "Reasoning", accent: "from-violet-400 to-fuchsia-500" },
  { key: "communication", label: "Communication", accent: "from-emerald-400 to-teal-500" },
  { key: "confidence", label: "Confidence", accent: "from-amber-400 to-orange-500" },
];

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-xl shadow-slate-950/30 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-400">
        <span>{label}</span>
        <span>{value || 0}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value || 0}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${accent}`}
        />
      </div>
    </div>
  );
}

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const report = location?.state?.report || location?.state || null;

  const data = report && typeof report === "object" ? report : null;
  const scores = data?.scores || {};
  const scoreCards = scoreMeta.map((item) => ({
    ...item,
    value: Number(scores[item.key] ?? 0),
  }));

  const overallScore = Number(data?.interview?.overallScore ?? data?.overallScore ?? 0);
  const overallLevel = data?.interview?.overallLevel ?? data?.overallLevel ?? "Intermediate";
  const hiringRecommendation = data?.hiringRecommendation || "Hire";

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-200">
        <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-8 text-center shadow-2xl shadow-slate-950/40">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">AI Interview Report</p>
          <h1 className="mt-4 text-2xl font-semibold text-white">No report available</h1>
          <p className="mt-3 max-w-md text-sm text-slate-400">The interview has ended, but no final report payload was returned from the backend.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => navigate("/interview")}
              className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Start Interview
            </button>
            <button
              onClick={() => navigate("/")}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-300">AI Interview Report</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Candidate Performance</h1>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/interview")}
              className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
            >
              Start New Interview
            </button>
            <button
              onClick={() => navigate("/")}
              className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20"
            >
              Back to Home
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-900 p-6 shadow-2xl shadow-slate-950/40"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div
                className="relative flex h-28 w-28 items-center justify-center rounded-full border border-cyan-400/30 bg-[conic-gradient(#22d3ee_0deg,#22d3ee_calc(var(--score)*3.6deg),rgba(15,23,42,0.6)_0deg)] shadow-lg shadow-cyan-500/20"
                style={{
                  "--score": overallScore,
                }}
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-950 text-2xl font-bold text-white">
                  {overallScore}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Overall Level</p>
                <div className="mt-2 text-3xl font-semibold text-white">{overallLevel}</div>
                <div className="mt-3 text-sm text-slate-300">Performance Index</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30"
          >
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Hiring Recommendation</p>
            <div className="mt-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
              {hiringRecommendation}
            </div>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallScore}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500"
              />
            </div>
            <div className="mt-3 text-sm text-slate-400">Candidate profile: {data?.candidate?.name || "Candidate"}</div>
          </motion.div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {scoreCards.map((item) => (
            <StatCard
              key={item.key}
              label={item.label}
              value={item.value}
              accent={item.accent}
            />
          ))}
        </div>

        <div className="mb-8 grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
            <h2 className="text-lg font-semibold text-white">Strengths</h2>
            <ul className="mt-5 space-y-3">
              {(data.strengths || []).length > 0 ? (
                (data.strengths || []).map((item) => (
                  <li key={item} className="flex items-start gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-3 text-slate-200">
                    <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-xs text-emerald-300">✓</span>
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-slate-700/80 bg-slate-950/40 p-3 text-sm text-slate-400">
                  No clear strengths recorded from this session.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
            <h2 className="text-lg font-semibold text-white">Needs Improvement</h2>
            <ul className="mt-5 space-y-3">
              {(data.weaknesses || []).length > 0 ? (
                (data.weaknesses || []).map((item) => (
                  <li key={item} className="flex items-start gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/5 p-3 text-slate-200">
                    <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 text-xs text-amber-300">!</span>
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-slate-700/80 bg-slate-950/40 p-3 text-sm text-slate-400">
                  No improvement areas recorded from this session.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-700/80 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
          <h2 className="text-lg font-semibold text-white">Topic Breakdown</h2>
          <div className="mt-6 space-y-5">
            {(data.topicBreakdown || []).length > 0 ? (
              (data.topicBreakdown || []).map((item) => (
                <div key={item.topic}>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                    <span className="font-medium text-white">{item.topic}</span>
                    <span>{item.score}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.score}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500"
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{item.level} · {item.summary || item.notes}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No answered topics were scored in this session.</p>
            )}
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-700/80 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
          <h2 className="text-lg font-semibold text-white">Recommended Learning Path</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(data.recommendations || data.recommendedCurriculum || []).map((item) => (
              <div key={`${item.day}-${item.topic || item.module}`} className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 transition hover:border-cyan-400/40 hover:bg-slate-950">
                <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Day {item.day}</p>
                <h3 className="mt-3 text-lg font-semibold text-white">{item.module || item.topic}</h3>
                <p className="mt-2 text-sm font-medium text-slate-200">{item.topic || "Core Topic"}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
          <h2 className="text-lg font-semibold text-white">Summary</h2>
          <p className="mt-4 text-base leading-8 text-slate-300">{data.summary}</p>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;
