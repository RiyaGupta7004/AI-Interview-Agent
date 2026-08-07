function SidebarCard({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/30">
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <div className="mt-3 text-lg font-semibold text-white">{value}</div>
      {detail ? <p className="mt-1 text-sm text-slate-400">{detail}</p> : null}
    </div>
  );
}

function InterviewSidebar() {
  return (
    <aside className="w-full space-y-4 lg:w-80">
      <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-900 p-5 shadow-xl shadow-slate-950/30">
        <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Current Topic</p>
        <h2 className="mt-4 text-xl font-semibold text-white">Retrieval-Augmented Generation</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Assessing the candidate’s understanding of architecture, tradeoffs, and practical use cases.
        </p>
      </div>

      <SidebarCard label="Interview Status" value="In Progress" detail="Candidate is responding to round 2." />
      <SidebarCard label="Questions Remaining" value="7" detail="Next question unlocks automatically." />
    </aside>
  );
}

export default InterviewSidebar;
