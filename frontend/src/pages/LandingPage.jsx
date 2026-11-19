import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import api, { getApiErrorMessage } from "../services/api.js";

const capabilities = [
  ["Adaptive by design", "Questions evolve with the candidate's demonstrated depth and reasoning."],
  ["Signal, not noise", "Structured evaluation makes technical, communication, and confidence signals clear."],
  ["Actionable outcomes", "A tailored report turns every interview into a practical next step."],
];

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current stroke-2"><path d="M4 10h11M11 5l5 5-5 5" /></svg>;
}

function SparkIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]"><path d="m12 3 1.55 5.45L19 10l-5.45 1.55L12 17l-1.55-5.45L5 10l5.45-1.55L12 3ZM19 16l.72 2.28L22 19l-2.28.72L19 22l-.72-2.28L16 19l2.28-.72L19 16Z" /></svg>;
}

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
      <div className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between py-6 sm:py-8">
          <a href="#top" className="flex items-center gap-3 rounded-lg" aria-label="Interviewly home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-300 text-slate-950 shadow-lg shadow-teal-400/10"><SparkIcon /></span>
            <span className="text-base font-bold tracking-tight text-white">interviewly</span>
          </a>
          <a href="#candidates" className="button-secondary px-3.5 py-2 text-xs sm:text-sm">Select candidate <ArrowIcon /></a>
        </header>

        <main id="top">
          <section className="grid gap-10 py-12 lg:grid-cols-[1.07fr_.93fr] lg:items-center lg:py-20">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }}>
              <p className="eyebrow flex items-center gap-2"><span className="status-dot" /> Intelligent interview practice</p>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.06] tracking-[-.045em] text-white sm:text-5xl lg:text-6xl">A more thoughtful way to interview.</h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Give every candidate a focused, adaptive technical interview — then turn the conversation into fair, useful hiring insight.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#candidates" className="button-primary">Begin an interview <ArrowIcon /></a>
                <a href="#how-it-works" className="button-secondary">How it works</a>
              </div>
              <div className="mt-10 flex items-center gap-7 text-sm text-slate-400">
                <span><strong className="block text-lg font-semibold text-slate-100">Adaptive</strong> question flow</span>
                <span className="h-8 w-px bg-slate-700" />
                <span><strong className="block text-lg font-semibold text-slate-100">Clear</strong> evaluation</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .5, delay: .08 }} className="surface relative overflow-hidden rounded-2xl p-5 sm:p-6">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-300/70 to-transparent" />
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-5">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-400/15 text-sm font-bold text-indigo-200">AI</span><div><p className="text-sm font-semibold text-white">Maya, AI interviewer</p><p className="mt-0.5 text-xs text-slate-400"><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />Ready to begin</p></div></div>
                <span className="rounded-md border border-slate-700/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300">01 / 08</span>
              </div>
              <div className="py-7"><p className="text-xs font-semibold uppercase tracking-[.13em] text-teal-300">Current prompt</p><p className="mt-3 text-xl font-medium leading-8 text-white">Tell me how you would make a retrieval system reliable at scale.</p></div>
              <div className="surface-subtle rounded-xl p-4"><div className="mb-2 flex items-center justify-between text-xs text-slate-400"><span>Interview signal</span><span className="font-semibold text-teal-300">Strong</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full w-[76%] rounded-full bg-gradient-to-r from-teal-400 to-cyan-300" /></div><div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]"><span className="rounded-md bg-slate-800/80 px-2 py-2 text-slate-300">Reasoning</span><span className="rounded-md bg-slate-800/80 px-2 py-2 text-slate-300">Depth</span><span className="rounded-md bg-slate-800/80 px-2 py-2 text-slate-300">Clarity</span></div></div>
            </motion.div>
          </section>

          <section id="candidates" className="scroll-mt-5 border-t border-slate-800/90 py-14 sm:py-20">
            <div className="flex flex-col gap-5 border-b border-slate-800/80 pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="eyebrow">New interview</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.035em] text-white">Choose a candidate</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Each plan uses their previous learning signals to meet them at the right level.</p></div>
              <button type="button" onClick={startInterview} disabled={!selectedId || loadingCandidates} className="button-primary shrink-0">Start Interview{selectedCandidate ? ` · ${selectedCandidate.name}` : ""}<ArrowIcon /></button>
            </div>

            {loadingCandidates && <div role="status" className="mt-6 grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="surface animate-pulse rounded-xl p-5"><div className="h-4 w-24 rounded bg-slate-700" /><div className="mt-5 h-6 w-40 rounded bg-slate-700" /><div className="mt-6 h-16 rounded bg-slate-800" /></div>)}</div>}
            {candidatesError && <div role="alert" className="mt-6 rounded-xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100">{candidatesError}</div>}
            {!loadingCandidates && !candidatesError && (candidates.length ? <div role="group" aria-label="Available candidates" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{candidates.map((candidate) => {
              const selected = candidate.id === selectedId;
              return <button key={candidate.id} type="button" onClick={() => setSelectedId(candidate.id)} aria-pressed={selected} aria-label={`${candidate.name}, ${candidate.role}, ${candidate.experience ?? 0} years experience`} className={`group rounded-xl border p-5 text-left transition duration-200 ${selected ? "border-teal-300/70 bg-teal-300/[.07] shadow-[0_0_0_1px_rgba(94,234,212,.12)]" : "border-slate-700/70 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-800/45"}`}>
                <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold tracking-[.13em] text-slate-500">{candidate.id}</p><h3 className="mt-2 text-lg font-semibold text-white">{candidate.name}</h3><p className="mt-1 text-sm text-slate-400">{candidate.role}</p></div><span className={`grid h-5 w-5 place-items-center rounded-full border text-[11px] ${selected ? "border-teal-300 bg-teal-300 text-slate-950" : "border-slate-600 text-transparent"}`}>✓</span></div>
                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-700/55 pt-4 text-xs"><div><dt className="text-slate-500">Experience</dt><dd className="mt-1 font-medium text-slate-200">{candidate.experience ?? 0} years</dd></div><div><dt className="text-slate-500">Missions</dt><dd className="mt-1 font-medium text-slate-200">{candidate.missionsCompleted ?? 0} complete</dd></div><div><dt className="text-slate-500">First try</dt><dd className="mt-1 font-medium text-slate-200">{candidate.missionsFirstTry ?? 0}</dd></div><div><dt className="text-slate-500">Skipped</dt><dd className="mt-1 font-medium text-slate-200">{candidate.skippedTopics ?? 0} topics</dd></div></dl>
              </button>;
            })}</div> : <p role="status" className="mt-6 rounded-xl border border-slate-700 p-5 text-sm text-slate-400">No candidates are currently available.</p>)}
          </section>

          <section id="how-it-works" className="scroll-mt-5 border-t border-slate-800/90 py-14 sm:py-20"><p className="eyebrow">Designed for focus</p><div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><h2 className="max-w-xl text-3xl font-semibold tracking-[-.035em] text-white">A better conversation from first question to final report.</h2><p className="max-w-sm text-sm leading-6 text-slate-400">Intentional structure keeps the interview human, even when the intelligence is automated.</p></div><div className="mt-9 grid gap-4 md:grid-cols-3">{capabilities.map(([title, description], index) => <article key={title} className="surface-subtle rounded-xl p-5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-800 text-sm font-semibold text-teal-300">0{index + 1}</span><h3 className="mt-6 text-base font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></article>)}</div></section>
        </main>
        <footer className="border-t border-slate-800 py-7 text-xs text-slate-500">Interviewly — intelligent interview practice</footer>
      </div>
    </div>
  );
}

export default LandingPage;
