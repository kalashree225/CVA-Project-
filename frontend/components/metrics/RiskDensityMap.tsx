"use client";

import React from "react";
import { ShieldAlert, Info, Users, AlertTriangle, Loader2 } from "lucide-react";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

export function RiskDensityMap() {
  const { riskDensity, loading } = useAnalytics();

  if (loading && riskDensity.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin opacity-20" />
      </div>
    );
  }

  // Find max risk for peak detection
  const peakRisk = [...riskDensity].sort((a, b) => b.risk - a.risk)[0];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-3 w-3 text-primary" />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Historical Anomaly Load</span>
          </div>
          <p className="text-xl font-black italic tracking-tighter text-foreground">
            {riskDensity.reduce((acc, curr) => acc + curr.risk, 0) > 100 ? "Heavy" : "Normal"} 
            <span className="text-[10px] not-italic font-medium text-muted-foreground ml-2">Global Cluster</span>
          </p>
        </div>
        <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 transition-all hover:bg-rose-500/10">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-3 w-3 text-rose-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">Predicted Peak</span>
          </div>
          <p className="text-xl font-black italic tracking-tighter text-rose-500">
            {peakRisk?.hour || "N/A"} <span className="text-[10px] not-italic font-medium opacity-60 ml-2">Risk Peak</span>
          </p>
        </div>
      </div>

      <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
         
         <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-2">
               <ShieldAlert className="h-4 w-4 text-primary" />
               <h4 className="text-xs font-black uppercase tracking-[0.2em]">Temporal <span className="text-primary">Risk Distribution</span></h4>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/5 shadow-sm">
               <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
               <span className="text-[8px] font-black uppercase tracking-widest">Live Sync</span>
            </div>
         </div>

         <div className="flex-1 flex items-end justify-between gap-2 relative z-10">
            {riskDensity.map((d) => (
              <div key={d.hour} className="flex-1 flex flex-col items-center gap-3 group/bar">
                <div className="relative w-full flex flex-col items-center">
                   <div className="absolute -top-8 bg-primary text-primary-foreground text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                     {d.risk.toFixed(1)}% Intensity
                   </div>
                   <div 
                      className="w-full bg-white/5 rounded-t-lg transition-all duration-500 group-hover/bar:bg-primary/20 relative overflow-hidden h-[150px]"
                    >
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-primary/40 transition-all duration-1000 group-hover/bar:bg-primary group-hover/bar:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                        style={{ height: `${Math.max(10, d.risk)}%` }}
                      />
                    </div>
                </div>
                <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground opacity-40 group-hover/bar:opacity-100 transition-opacity">{d.hour}</span>
              </div>
            ))}
         </div>

         <div className="mt-8 flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5 relative z-10 hover:border-primary/20 transition-colors">
            <Info className="h-3 w-3 text-primary shrink-0 mt-0.5" />
            <p className="text-[9px] leading-relaxed italic text-muted-foreground/80">
               Real-time kernel audit suggests a <span className="text-foreground font-bold">{((peakRisk?.risk || 0) / 2).toFixed(1)}% deviation</span> during peak cycles. Current infrastructure is <span className="text-primary font-bold">Scaling Nominal</span>.
            </p>
         </div>
      </div>
    </div>
  );
}
