"use client";

import { ConnectionStatus } from "@/types/metrics";
import { cn } from "@/lib/utils";

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { dotClass: string; label: string; textClass: string }
> = {
  connected: {
    dotClass: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    label: "Live",
    textClass: "text-emerald-500",
  },
  reconnecting: {
    dotClass: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    label: "Reconnecting\u2026",
    textClass: "text-amber-500",
  },
  disconnected: {
    dotClass: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]",
    label: "Offline",
    textClass: "text-rose-500",
  },
};

export function ConnectionStatusIndicator({
  status,
  className,
}: ConnectionStatusIndicatorProps) {
  const { dotClass, label, textClass } = STATUS_CONFIG[status];

  return (
    <div
      className={cn("flex items-center gap-2.5 px-3 py-1", className)}
      aria-label={`System status: ${label}`}
    >
      <div className="relative flex h-2 w-2">
        {status === "connected" && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span
          className={cn("relative inline-flex rounded-full h-2 w-2", dotClass)}
          aria-hidden="true"
        />
      </div>
      <span className={cn("text-xs font-bold tracking-widest uppercase", textClass)}>
        {label}
      </span>
    </div>
  );
}

export default ConnectionStatusIndicator;
