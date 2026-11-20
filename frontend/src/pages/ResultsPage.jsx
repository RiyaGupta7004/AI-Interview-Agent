import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const scoreMeta = [
  { key: "technical", label: "Technical", accent: "from-teal-400 to-emerald-500" },
  { key: "reasoning", label: "Reasoning", accent: "from-emerald-400 to-green-500" },
  { key: "communication", label: "Communication", accent: "from-emerald-400 to-teal-500" },
  { key: "confidence", label: "Confidence", accent: "from-amber-400 to-orange-500" },
];

function StatCard({ label, value, accent }) {
  return (
    <div className="surface-subtle relative overflow-hidden rounded-2xl p-4">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent}`} />
      <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[.13em] text-slate-400">
        <span>{label}</span>
        <span>{value || 0}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-900">
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
  const headingRef = useRef(null);

  const data = report && typeof report === "object" ? report : null;
  const scores = data?.scores || {};
  const scoreCards = scoreMeta.map((item) => ({
    ...item,
    value: Number(scores[item.key] ?? 0),
  }));

  const overallScore = Number(data?.interview?.overallScore ?? data?.overallScore ?? 0);
  const overallLevel = data?.interview?.overallLevel ?? data?.overallLevel ?? "Intermediate";
  const hiringRecommendation = data?.hiringRecommendation || "Hire";

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  if (!data) {
    return (
    <div className="app-shell flex min-h-screen items-center justify-center px-6 text-slate-200">
        <div className="surface rounded-3xl p-8 text-center shadow-2xl shadow-slate-950/40">
          <p className="eyebrow">Interview report</p>
          <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-2xl font-semibold text-white">No report available</h1>
          <p className="mt-3 max-w-md text-sm text-slate-400">The interview has ended, but no final report payload was returned from the backend.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => navigate("/interview")}
              className="button-primary"
            >
              Start Interview
            </button>
            <button
              onClick={() => navigate("/")}
              className="button-secondary"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell px-4 py-6 text-slate-100 sm:px-6 sm:py-8 lg:px-8">
      <main id="main-content" tabIndex={-1} className="relative mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Interview report</p>
            <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-3xl font-semibold tracking-[-.04em] text-white sm:text-4xl">Candidate Performance</h1>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/interview")}
              className="button-secondary"
            >
              Start New Interview
            </button>
            <button
              onClick={() => navigate("/")}
              className="button-primary"
            >
              Back to Home
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface relative overflow-hidden rounded-3xl p-6 sm:p-7"
          >
            <div className="glow-line absolute inset-x-0 top-0 h-px" />
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div
                className="relative flex h-28 w-28 items-center justify-center rounded-full border border-emerald-300/30 bg-[conic-gradient(#10B981_0deg,#14B8A6_calc(var(--score)*2.3deg),#5EEAD4_calc(var(--score)*3.6deg),rgba(30,41,59,.7)_0deg)] shadow-[0_0_30px_rgba(16,185,129,.16)]"
                style={{
                  "--score": overallScore,
                }}
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/[.04] bg-[#071510] text-2xl font-bold text-white">
                  {overallScore}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-teal-300">Overall level</p>
                <div className="mt-2 text-3xl font-semibold text-white">{overallLevel}</div>
                <div className="mt-3 text-sm text-slate-300">Performance Index</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="surface rounded-3xl p-6 sm:p-7"
          >
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Hiring recommendation</p>
            <div className="mt-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/[.08] px-3 py-1 text-sm font-semibold text-emerald-100">
              {hiringRecommendation}
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-900">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallScore}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-green-400 shadow-[0_0_14px_rgba(16,185,129,.6)]"
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
          <div className="surface rounded-2xl p-6">
            <p className="eyebrow">What stood out</p><h2 className="mt-2 text-lg font-semibold text-white">Strengths</h2>
            <ul className="mt-5 space-y-3">
              {(data.strengths || []).length > 0 ? (
                (data.strengths || []).map((item) => (
                  <li key={item} className="flex items-start gap-3 rounded-lg border border-emerald-400/15 bg-emerald-400/[.05] p-3 text-sm text-slate-200">
                    <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-xs text-emerald-300">✓</span>
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="rounded-lg border border-slate-700/80 bg-slate-950/40 p-3 text-sm text-slate-400">
                  No clear strengths recorded from this session.
                </li>
              )}
            </ul>
          </div>

          <div className="surface rounded-2xl p-6">
            <p className="eyebrow">Growth opportunity</p><h2 className="mt-2 text-lg font-semibold text-white">Needs Improvement</h2>
            <ul className="mt-5 space-y-3">
              {(data.weaknesses || []).length > 0 ? (
                (data.weaknesses || []).map((item) => (
                  <li key={item} className="flex items-start gap-3 rounded-lg border border-amber-400/15 bg-amber-400/[.05] p-3 text-sm text-slate-200">
                    <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 text-xs text-amber-300">!</span>
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="rounded-lg border border-slate-700/80 bg-slate-950/40 p-3 text-sm text-slate-400">
                  No improvement areas recorded from this session.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="surface mb-8 rounded-2xl p-6">
          <p className="eyebrow">Performance by area</p><h2 className="mt-2 text-lg font-semibold text-white">Topic Breakdown</h2>
          <div className="mt-6 space-y-5">
            {(data.topicBreakdown || []).length > 0 ? (
              (data.topicBreakdown || []).map((item) => (
                <div key={item.topic}>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                    <span className="font-medium text-white">{item.topic}</span>
                    <span>{item.score}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.score}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-green-400"
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

        <div className="surface mb-8 rounded-2xl p-6">
          <p className="eyebrow">Next best actions</p><h2 className="mt-2 text-lg font-semibold text-white">Recommended Learning Path</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(data.recommendations || data.recommendedCurriculum || []).map((item) => (
              <div key={`${item.day}-${item.topic || item.module}`} className="rounded-xl border border-slate-700 bg-slate-950/40 p-4 transition hover:-translate-y-0.5 hover:border-emerald-300/45 hover:bg-slate-950/70">
                <p className="text-[10px] font-bold uppercase tracking-[.13em] text-teal-300">Day {item.day}</p>
                <h3 className="mt-3 text-lg font-semibold text-white">{item.module || item.topic}</h3>
                <p className="mt-2 text-sm font-medium text-slate-200">{item.topic || "Core Topic"}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.reason}</p>
              </div>
            ))}
          </div>
          {(data.recommendations || data.recommendedCurriculum || []).length === 0 ? <p className="mt-5 rounded-lg border border-slate-700/70 bg-slate-950/30 p-4 text-sm text-slate-400">No specific learning path was generated for this session.</p> : null}
        </div>

        <div className="surface rounded-2xl p-6">
          <p className="eyebrow">Interview summary</p><h2 className="mt-2 text-lg font-semibold text-white">The takeaway</h2>
          <p className="mt-4 text-base leading-8 text-slate-300">{data.summary}</p>
        </div>
      </main>
    </div>
  );
}

export default ResultsPage;
