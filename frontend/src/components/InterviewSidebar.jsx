function SidebarCard({ label, value, detail }) {
  return (
    <div className="border-b border-slate-700/60 py-4 first:pt-0 last:border-0 last:pb-0">
      <p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-500">{label}</p>
      <div className="mt-1.5 text-sm font-semibold text-white">{value}</div>
      {detail ? <p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p> : null}
    </div>
  );
}

function InterviewSidebar({ topic, status, questionsRemaining, candidateName }) {
  const currentTopic = topic || "Preparing topic...";
  const currentStatus = status || "Starting...";
  const remaining = Number.isFinite(Number(questionsRemaining)) ? Math.max(0, Number(questionsRemaining)) : 0;

  return (
    <aside className="w-full lg:w-72 xl:w-80">
      <div className="surface rounded-xl p-5">
        <p className="text-[10px] font-bold uppercase tracking-[.13em] text-teal-300">Now discussing</p>
        <h2 className="mt-3 text-lg font-semibold tracking-tight text-white">{currentTopic}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">The conversation adapts to the depth and clarity of each response.</p>
        <div className="mt-5 border-t border-slate-700/60 pt-4">
          {candidateName ? <SidebarCard label="Candidate" value={candidateName} detail="Personalized interview plan" /> : null}
          <SidebarCard label="Session status" value={currentStatus} detail={currentStatus === "Completed" ? "Interview finished." : "Your next response will unlock the next prompt."} />
          <SidebarCard label="Remaining" value={`${remaining} questions`} detail="Progress updates automatically." />
        </div>
      </div>
    </aside>
  );
}

export default InterviewSidebar;
