import { ConnectionStatus } from "../shared/types";

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  isStale?: boolean;
}

const statusConfig: Record<ConnectionStatus, { color: string; label: string }> = {
  connected: { color: "bg-dex-green", label: "connected" },
  reconnecting: { color: "bg-dex-yellow", label: "reconnecting" },
  disconnected: { color: "bg-dex-red", label: "disconnected" },
  error: { color: "bg-dex-red", label: "server error" },
};

export function ConnectionIndicator({ status, isStale }: ConnectionIndicatorProps) {
  const base = statusConfig[status];
  const color = isStale ? "bg-dex-yellow" : base.color;
  const label = isStale ? "data may be stale" : base.label;

  return (
    <div className="relative group flex items-center">
      <div className={`w-1.5 h-1.5 rounded-full ${color} ${isStale ? "animate-pulse" : ""}`} />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2 py-1 text-[10px] font-medium text-dex-bg bg-dex-text rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
        {label}
      </div>
    </div>
  );
}
