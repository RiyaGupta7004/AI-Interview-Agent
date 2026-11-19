function InterviewHeader({ candidateName }) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4 border-b border-slate-800/80 pb-5 sm:mb-8">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-300 text-sm font-bold text-slate-950">I</div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-teal-300">Interview session</p>
          <h1 className="mt-1 truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
            {candidateName ? `${candidateName}'s interview` : "Technical interview"}
          </h1>
        </div>
      </div>
      <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[.07] px-3 py-1.5 text-xs font-semibold text-emerald-200 sm:flex">
        <span className="status-dot" /> Live session
      </div>
    </header>
  );
}

export default InterviewHeader;
