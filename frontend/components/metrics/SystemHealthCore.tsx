"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Shield, Cpu, Activity, Zap, Server, Globe } from "lucide-react";

export function SystemHealthCore() {
  const [health, setHealth] = useState(98.42);

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(prev => {
        const delta = (Math.random() - 0.5) * 0.1;
        return Math.max(90, Math.min(100, prev + delta));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-10">
      {/* Central Health Gauge */}
      <div className="flex flex-col items-center justify-center py-6 relative">
         <div className="h-48 w-48 rounded-full border-[10px] border-white/5 flex items-center justify-center relative group">
            <div className="absolute inset-0 rounded-full border-[10px] border-primary/20 border-t-primary animate-spin-slow" />
            <div className="absolute inset-4 rounded-full border-[2px] border-dashed border-white/10" />
            
            <div className="text-center group-hover:scale-110 transition-transform duration-500">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">Global Health</p>
               <h3 className="text-5xl font-black italic tracking-tighter text-foreground">{health.toFixed(2)}%</h3>
            </div>

            {/* Orbiting Elements */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-primary shadow-[0_0_10px_rgba(16,185,129,1)]" />
         </div>
      </div>

      {/* Health Verticals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <HealthCard label="Inference Engine" value="Nominal" icon={<Cpu className="h-4 w-4" />} status="success" />
         <HealthCard label="Storage Node" value="Synchronized" icon={<Server className="h-4 w-4" />} status="success" />
         <HealthCard label="Security Mesh" value="Active" icon={<Shield className="h-4 w-4" />} status="warning" />
      </div>

      {/* Network Latency Visualization */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
               <Globe className="h-4 w-4 text-primary" />
               <span className="text-[10px] font-black uppercase tracking-widest">Global Sync Latency</span>
            </div>
            <span className="text-xs font-black italic">14.2ms</span>
         </div>
         <div className="flex gap-1 h-8 items-end">
            {Array(30).fill(0).map((_, i) => (
              <div 
                key={i} 
                className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary transition-colors cursor-help"
                style={{ height: `${Math.random() * 80 + 20}%` }}
              />
            ))}
         </div>
      </div>
    </div>
  );
}

function HealthCard({ label, value, icon, status }: any) {
  return (
    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all hover:scale-[1.02]">
       <div className="flex items-center justify-between mb-4">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:text-primary transition-colors">
             {icon}
          </div>
          <div className={cn(
            "h-2 w-2 rounded-full",
            status === "success" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
          )} />
       </div>
       <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">{label}</p>
       <p className="text-xs font-black italic uppercase">{value}</p>
    </div>
  )
}
