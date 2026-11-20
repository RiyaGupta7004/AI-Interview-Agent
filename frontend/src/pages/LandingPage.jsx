import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import api, { getApiErrorMessage } from "../services/api.js";

const capabilities = [
  ["Adaptive intelligence", "Questions adjust to reveal real depth, not rehearsed answers.", "01"],
  ["Signal-rich scoring", "See technical skill, reasoning, clarity, and confidence in context.", "02"],
  ["Actionable outcomes", "Turn every conversation into a focused, practical growth plan.", "03"],
];

function ArrowIcon() { return <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current stroke-2"><path d="M4 10h11M11 5l5 5-5 5" /></svg>; }
function SparkIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]"><path d="m12 3 1.55 5.45L19 10l-5.45 1.55L12 17l-1.55-5.45L5 10l5.45-1.55L12 3ZM19 16l.72 2.28L22 19l-2.28.72L19 22l-.72-2.28L16 19l2.28-.72L19 16Z" /></svg>; }
function CheckIcon() { return <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-none stroke-current stroke-[2.5]"><path d="m4 10 3.4 3.4L16 5.5" /></svg>; }

function LandingPage() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [candidatesError, setCandidatesError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadCandidates() {
      try {
        setLoadingCandidates(true); setCandidatesError("");
        const { data } = await api.get("/api/interview/candidates");
        if (cancelled) return;
        const list = Array.isArray(data?.candidates) ? data.candidates : [];
        setCandidates(list); setSelectedId(list[0]?.id || "");
      } catch (error) {
        if (!cancelled) setCandidatesError(getApiErrorMessage(error, "Unable to load candidates."));
      } finally { if (!cancelled) setLoadingCandidates(false); }
    }
    void loadCandidates();
    return () => { cancelled = true; };
  }, []);

  const selectedCandidate = useMemo(() => candidates.find((candidate) => candidate.id === selectedId) || null, [candidates, selectedId]);
  const startInterview = () => {
    if (!selectedId) return;
    navigate("/interview", { state: { candidateId: selectedId, candidateName: selectedCandidate?.name || "" } });
  };

  return (
    <div className="app-shell text-slate-100">
      <div className="relative mx-auto max-w-7xl px-5 pb-14 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between py-5 sm:py-7">
          <a href="#top" className="flex items-center gap-3 rounded-xl" aria-label="Interviewly home">
            <span className="brand-mark"><SparkIcon /></span>
            <span><span className="block text-base font-bold tracking-tight text-white">interviewly</span><span className="hidden text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500 sm:block">AI assessment studio</span></span>
          </a>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Landing navigation"><a className="nav-link" href="#how-it-works">How it works</a><a className="nav-link" href="#candidates">Candidates</a></nav>
          <a href="#candidates" className="button-secondary px-3.5 py-2 text-xs sm:text-sm">New interview <ArrowIcon /></a>
        </header>

        <main id="main-content" tabIndex={-1}>
          <section className="grid gap-10 py-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-20">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/[.06] px-3 py-1.5"><span className="status-dot" /><span className="text-[11px] font-bold uppercase tracking-[.13em] text-teal-100">Adaptive interviews, elevated</span></div>
              <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.03] tracking-[-.055em] text-white sm:text-5xl lg:text-[4.2rem]">The intelligent way to <span className="bg-gradient-to-r from-teal-200 via-emerald-200 to-green-300 bg-clip-text text-transparent">discover potential.</span></h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Give every candidate a thoughtful, adaptive interview—and turn the conversation into clear, confident hiring insight.</p>
              <div className="mt-8 flex flex-wrap gap-3"><a href="#candidates" className="button-primary">Start an interview <ArrowIcon /></a><a href="#how-it-works" className="button-secondary">Explore the experience</a></div>
              <div className="mt-10 grid max-w-lg grid-cols-3 gap-3 border-t border-slate-700/60 pt-6 text-sm"><div><strong className="block text-xl font-semibold text-white">8–12</strong><span className="text-xs text-slate-400">Adaptive prompts</span></div><div><strong className="block text-xl font-semibold text-white">4D</strong><span className="text-xs text-slate-400">Skill evaluation</span></div><div><strong className="block text-xl font-semibold text-white">Live</strong><span className="text-xs text-slate-400">AI guidance</span></div></div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .55, delay: .1 }} className="surface relative overflow-hidden rounded-3xl p-5 sm:p-6">
              <div className="glow-line absolute inset-x-0 top-0 h-px" />
              <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-emerald-500/15 blur-3xl" />
              <div className="relative flex items-center justify-between border-b border-slate-700/60 pb-5">
                <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-300/20 bg-gradient-to-br from-emerald-500/30 to-teal-500/20 text-sm font-bold text-teal-100">AI</span><div><p className="text-sm font-semibold text-white">Maya, AI interviewer</p><p className="mt-1 text-xs text-slate-400"><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,.8)]" />Analyzing in real time</p></div></div>
                <span className="rounded-lg border border-emerald-300/20 bg-emerald-400/[.08] px-2.5 py-1 text-[11px] font-bold text-emerald-200">01 / 08</span>
              </div>
              <div className="relative py-7"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-teal-300">Current prompt</p><p className="mt-3 text-xl font-medium leading-8 text-white sm:text-2xl">How would you build a retrieval system that stays reliable at scale?</p></div>
              <div className="relative rounded-2xl border border-slate-700/70 bg-slate-950/30 p-4"><div className="mb-3 flex items-center justify-between text-xs text-slate-400"><span>Interview signal</span><span className="font-bold text-emerald-300">Strong trajectory</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full w-[76%] rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-green-400 shadow-[0_0_16px_rgba(16,185,129,.55)]" /></div><div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]"><span className="rounded-lg border border-teal-400/10 bg-teal-400/[.06] px-2 py-2 text-teal-100">Reasoning</span><span className="rounded-lg border border-emerald-400/10 bg-emerald-400/[.08] px-2 py-2 text-emerald-100">Depth</span><span className="rounded-lg border border-green-400/10 bg-green-400/[.08] px-2 py-2 text-green-100">Clarity</span></div></div>
            </motion.div>
          </section>

          <section id="candidates" className="scroll-mt-5 border-t border-slate-700/60 py-14 sm:py-20">
            <div className="flex flex-col gap-5 border-b border-slate-700/60 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Interview workspace</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-white">Choose your candidate</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Each interview plan considers prior learning signals to find the right level of challenge.</p></div><button type="button" onClick={startInterview} disabled={!selectedId || loadingCandidates} className="button-primary shrink-0">Start Interview{selectedCandidate ? ` · ${selectedCandidate.name}` : ""}<ArrowIcon /></button></div>

            {loadingCandidates && <div role="status" className="mt-6 grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="surface animate-pulse rounded-2xl p-5"><div className="h-3 w-24 rounded bg-slate-700" /><div className="mt-5 h-6 w-40 rounded bg-slate-700" /><div className="mt-6 h-16 rounded-xl bg-slate-800" /></div>)}</div>}
            {candidatesError && <div role="alert" className="mt-6 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100">{candidatesError}</div>}
            {!loadingCandidates && !candidatesError && (candidates.length ? <div role="group" aria-label="Available candidates" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{candidates.map((candidate) => {
              const selected = candidate.id === selectedId;
              return <button key={candidate.id} type="button" onClick={() => setSelectedId(candidate.id)} aria-pressed={selected} aria-label={`${candidate.name}, ${candidate.role}, ${candidate.experience ?? 0} years experience`} className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition duration-200 ${selected ? "border-emerald-400/70 bg-emerald-400/[.09] shadow-[0_12px_30px_rgba(16,185,129,.14),inset_0_1px_0_rgba(255,255,255,.05)]" : "border-slate-700/70 bg-[#10251d]/65 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-[#17382c]"}`}>
                {selected ? <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent" /> : null}
                <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold tracking-[.13em] text-slate-500">{candidate.id}</p><h3 className="mt-2 text-lg font-semibold text-white">{candidate.name}</h3><p className="mt-1 text-sm text-slate-400">{candidate.role}</p></div><span className={`grid h-6 w-6 place-items-center rounded-full border text-[11px] ${selected ? "border-teal-300 bg-teal-300 text-slate-950 shadow-[0_0_15px_rgba(45,212,191,.35)]" : "border-slate-600 text-transparent"}`}><CheckIcon /></span></div>
                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-700/55 pt-4 text-xs"><div><dt className="text-slate-500">Experience</dt><dd className="mt-1 font-medium text-slate-200">{candidate.experience ?? 0} years</dd></div><div><dt className="text-slate-500">Missions</dt><dd className="mt-1 font-medium text-slate-200">{candidate.missionsCompleted ?? 0} complete</dd></div><div><dt className="text-slate-500">First try</dt><dd className="mt-1 font-medium text-slate-200">{candidate.missionsFirstTry ?? 0}</dd></div><div><dt className="text-slate-500">Skipped</dt><dd className="mt-1 font-medium text-slate-200">{candidate.skippedTopics ?? 0} topics</dd></div></dl>
              </button>;
            })}</div> : <p role="status" className="mt-6 rounded-2xl border border-slate-700 p-5 text-sm text-slate-400">No candidates are currently available.</p>)}
          </section>

          <section id="how-it-works" className="scroll-mt-5 border-t border-slate-700/60 py-14 sm:py-20"><p className="eyebrow">Designed for meaningful signal</p><div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><h2 className="max-w-xl text-3xl font-semibold tracking-[-.04em] text-white">A focused conversation, from first prompt to final report.</h2><p className="max-w-sm text-sm leading-6 text-slate-400">A premium, intelligent process built to leave both candidates and teams with clarity.</p></div><div className="mt-9 grid gap-4 md:grid-cols-3">{capabilities.map(([title, description, number]) => <article key={title} className="surface-subtle rounded-2xl p-5 transition duration-200 hover:-translate-y-1 hover:border-emerald-400/40"><span className="inline-flex rounded-lg border border-emerald-300/15 bg-emerald-400/[.08] px-2.5 py-1 text-[10px] font-bold tracking-[.13em] text-emerald-200">{number}</span><h3 className="mt-6 text-base font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></article>)}</div></section>
        </main>
        <footer className="flex flex-col gap-2 border-t border-slate-700/60 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Interviewly — intelligent interview practice</span><span>Built for clarity, designed for momentum.</span></footer>
      </div>
    </div>
  );
}

export default LandingPage;
