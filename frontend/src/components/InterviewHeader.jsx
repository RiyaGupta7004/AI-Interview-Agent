function InterviewHeader() {
  return (
    <header className="mb-8 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-cyan-300/80">
          Interview Session
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          AI Interview Agent
        </h1>
      </div>

      <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-100 shadow-lg shadow-cyan-950/30">
        Live Mock
      </div>
    </header>
  );
}

export default InterviewHeader;
