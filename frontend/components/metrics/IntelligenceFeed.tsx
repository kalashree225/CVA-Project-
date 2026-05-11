"use client";

import { useEffect, useState } from "react";
import { Terminal, Shield, Activity, Zap, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function IntelligenceFeed() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${baseUrl}/api/v1/intelligence`);
        const data = await response.json();
        setEvents(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch intelligence:", error);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="creative-card p-0 overflow-hidden bg-black/40 border-white/5 h-[500px] flex flex-col shadow-2xl">
      {/* Feed Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Terminal className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest italic">Intelligence <span className="text-primary">Stream</span></h2>
            <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Vector Logs // Sync Active</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[9px] font-black uppercase text-success tracking-widest">Live</span>
        </div>
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono scrollbar-thin scrollbar-thumb-white/10">
        {loading && events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
             <Loader2 className="h-6 w-6 animate-spin text-primary" />
             <p className="italic text-[10px] uppercase font-black tracking-widest">Establishing Neural Uplink...</p>
          </div>
        ) : (
          events.map((event, i) => (
            <div 
              key={i} 
              className={cn(
                "p-3 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all group animate-in slide-in-from-right-2 duration-300",
                event.status === "Critical" ? "bg-rose-500/5 border-rose-500/10" : "bg-white/[0.02]"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "mt-1 p-1.5 rounded-md border",
                  event.status === "Critical" ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                  event.type === "SECURITY_PROTOCOL" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                  "bg-primary/10 border-primary/20 text-primary"
                )}>
                  {event.status === "Critical" ? <Shield className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                      {event.timestamp} // {event.type}
                    </span>
                    <span className={cn(
                      "text-[8px] font-black uppercase px-1.5 py-0.5 rounded border tracking-widest",
                      event.status === "Critical" ? "border-rose-500/30 text-rose-500" : "border-white/10 text-muted-foreground"
                    )}>
                      {event.status}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium leading-relaxed text-foreground/90 group-hover:text-white transition-colors">
                    {event.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Feed Footer */}
      <div className="px-6 py-3 border-t border-white/5 bg-white/5 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="flex flex-col">
               <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Total Events</span>
               <span className="text-xs font-black italic">{events.length}</span>
            </div>
            <div className="h-6 w-[1px] bg-white/10" />
            <div className="flex flex-col">
               <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">System Load</span>
               <span className="text-xs font-black italic text-primary">84%</span>
            </div>
         </div>
         <button className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center gap-2">
            Clear Buffer <ChevronRight className="h-3 w-3 opacity-40" />
         </button>
      </div>
    </section>
  );
}
