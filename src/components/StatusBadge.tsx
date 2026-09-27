import { ClaudeSession, SessionStatus, statusLabels } from "@/lib/types";

const statusConfig: Record<SessionStatus, { dotColor: string; textColor: string; bgColor: string; pulse: boolean }> = {
  working: { dotColor: "bg-emerald-400", textColor: "text-emerald-300", bgColor: "bg-emerald-500/10", pulse: true },
  idle: { dotColor: "bg-amber-400", textColor: "text-amber-300", bgColor: "bg-amber-500/10", pulse: false },
  waiting: { dotColor: "bg-blue-400", textColor: "text-blue-300", bgColor: "bg-blue-500/10", pulse: true },
  errored: { dotColor: "bg-red-400", textColor: "text-red-300", bgColor: "bg-red-500/10", pulse: false },
  finished: { dotColor: "bg-zinc-500", textColor: "text-zinc-400", bgColor: "bg-zinc-500/10", pulse: false },
};

const staleConfig = {
  dotColor: "bg-zinc-500",
  textColor: "text-zinc-400",
  bgColor: "bg-zinc-700/15",
  pulse: false,
};

export function StatusBadge({
  status,
  orphaned,
  stale,
}: {
  status: SessionStatus;
  orphaned?: boolean;
  stale?: boolean;
}) {
  const config = stale ? staleConfig : statusConfig[status];
  const label = stale ? "Stale" : statusLabels[status];
  return (
    <div className="flex items-center gap-1.5">
      {orphaned && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider text-orange-300 bg-orange-500/10">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
          Orphaned
        </span>
      )}
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${config.textColor} ${config.bgColor}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor} ${config.pulse ? "animate-soft-pulse" : ""}`} />
        {label}
      </span>
    </div>
  );
}

// Where the session runs: "GoLand", "Terminal", "GoLand · tmux: api"
export function TerminalBadge({ session }: { session: Pick<ClaudeSession, "terminalApp" | "tmuxSession"> }) {
  const parts = [session.terminalApp?.appName, session.tmuxSession && `tmux: ${session.tmuxSession}`].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded-sm bg-white/4 border border-white/6 text-zinc-400 font-(family-name:--font-geist-mono) truncate max-w-[180px]">
      {parts.join(" · ")}
    </span>
  );
}
