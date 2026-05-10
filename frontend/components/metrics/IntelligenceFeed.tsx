"use client";

import { useMetricsStore } from "@/lib/store/metricsStore";
import { cn } from "@/lib/utils";
import { Terminal, ShieldAlert, CheckCircle2, ChevronRight, Eye } from "lucide-react";
import { formatDuration } from "@/lib/utils";

export function IntelligenceFeed() {
  const { events, setSelectedEvent } = useMetricsStore();

  return (
    <div className="creative-card p-0 overflow-hidden border-white/5 bg-black/40 h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-black uppercase tracking-widest italic">Live Intelligence <span className="text-primary">Feed</span></h3>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden sm:flex items-center gap-2">
              <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-2 py-0.5 rounded bg-white/5 border border-white/5">Auto-Scaling: On</span>
           </div>
           <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Streaming</span>
          </div>
        </div>
      </div>

      <div className="flex-1 divide-y divide-white/5 overflow-y-auto custom-scrollbar">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="h-10 w-10 rounded-full border-2 border-dashed border-white/10 animate-spin mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest">Awaiting system packets...</p>
          </div>
        ) : (
          events.map((event, i) => (
            <div key={event.run_id + i} className="group flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors relative overflow-hidden">
              {/* Event Progress Bar */}
              <div className="absolute bottom-0 left-0 h-0.5 bg-primary/20 w-full" />
              <div 
                className={cn("absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-1000", event.status === "failed" && "bg-rose-500")} 
                style={{ width: `${Math.random() * 100}%` }} 
              />

              <div className="flex items-center gap-4 relative z-10">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110",
                  event.status === "success" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  {event.status === "success" ? <CheckCircle2 className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black italic tracking-tight">{event.model_name}</span>
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest border",
                      event.event_type === "inference" ? "bg-primary/10 border-primary/20 text-primary" : "bg-accent/10 border-accent/20 text-accent"
                    )}>
                      {event.event_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-mono text-muted-foreground opacity-50">SHM-{event.run_id.slice(0, 6)}</span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-tighter italic">
                      {formatDuration(event.latency_ms)} Latency
                    </span>
                    {event.latency_ms > 200 && (
                      <span className="text-[9px] font-black text-rose-500 uppercase animate-pulse">Auto-Mitigated</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 relative z-10">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-black italic tracking-tighter">{event.token_count_input + event.token_count_output} TOK</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                    ${event.cost_usd.toFixed(4)}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedEvent(event)}
                  className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-6 py-4 border-t border-white/5 bg-white/5 flex justify-between items-center">
        <div className="flex flex-col">
           <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Global Intelligence Feed</p>
           <p className="text-[10px] font-black text-primary uppercase italic">Active Node: Sentinel-01</p>
        </div>
        <button className="px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-black text-primary uppercase tracking-widest hover:bg-white/5 transition-colors flex items-center gap-2 group">
          Intelligence Log <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
