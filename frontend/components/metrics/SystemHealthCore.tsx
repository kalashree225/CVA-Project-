"use client";

import { useMetricsStore } from "@/lib/store/metricsStore";
import { cn } from "@/lib/utils";
import { Zap, ShieldCheck, Cpu } from "lucide-react";

export function SystemHealthCore() {
  const { connectionStatus, events } = useMetricsStore();
  
  // Calculate a mock "System Load" based on event frequency
  const systemLoad = events.length > 0 ? Math.min(events.length / 5 + 15.5, 99.9).toFixed(1) : "12.4";
  const isHealthy = events.filter(e => e.status === "failed").length < events.length * 0.05;

  return (
    <div className="creative-card flex flex-col md:flex-row items-center gap-10 bg-gradient-to-br from-card/80 to-secondary/30 relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-primary/10 transition-colors" />
      
      <div className="relative h-48 w-48 flex items-center justify-center">
        {/* Animated Pulse Rings */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping duration-[3s]" />
        <div className="absolute inset-4 rounded-full border-2 border-accent/20 animate-ping duration-[4s]" />
        
        {/* Core Visual */}
        <div className="relative h-32 w-32 rounded-full bg-background flex flex-col items-center justify-center border border-white/10 shadow-2xl shadow-primary/20 group-hover:scale-105 transition-transform duration-500">
          <Zap className={cn("h-8 w-8 mb-1 transition-colors duration-500", isHealthy ? "text-primary" : "text-rose-500")} />
          <span className="text-3xl font-black tracking-tighter italic animate-pulse-subtle">{systemLoad}%</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Sync Velocity</span>
        </div>
        
        {/* Status Indicators */}
        <div className="absolute -top-2 -right-2 h-10 w-10 rounded-xl bg-card border border-white/10 flex items-center justify-center shadow-lg group-hover:-translate-y-1 transition-transform">
          <ShieldCheck className={cn("h-5 w-5", isHealthy ? "text-success" : "text-rose-500")} />
        </div>
      </div>

      <div className="flex-1 space-y-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
             <span className="text-[10px] font-black uppercase tracking-widest text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">Operational</span>
             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-0.5 rounded bg-white/5 border border-white/5">Auto-Scaled</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight uppercase italic underline decoration-primary/30 decoration-8 underline-offset-4">
            Sentinel <span className="text-primary">Intelligence</span>
          </h2>
          <p className="text-muted-foreground mt-4 leading-relaxed max-w-xl text-sm font-medium">
            Active telemetry monitoring is <span className="text-foreground font-bold uppercase">{connectionStatus}</span>. 
            All edge nodes are responding within the <span className="text-success font-bold">nominal range</span> of 150ms. 
            Automated threat mitigation is currently in standby mode.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatusMetric label="Nodes" value="12 / 12" subLabel="Online" />
          <StatusMetric label="Throughput" value="24.2 TFLOPS" subLabel="Stable" />
          <StatusMetric label="Sync Latency" value="0.4ms" subLabel="Nominal" />
        </div>
      </div>
    </div>
  );
}

function StatusMetric({ label, value, subLabel }: { label: string, value: string, subLabel: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group/metric">
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black mb-1">{label}</p>
      <p className="text-xl font-black italic tracking-tighter">{value}</p>
      <div className="flex items-center gap-1 mt-1">
        <div className="h-1 w-1 rounded-full bg-success" />
        <p className="text-[8px] font-black uppercase text-success">{subLabel}</p>
      </div>
    </div>
  );
}
