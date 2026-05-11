"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Cpu, Database, Activity, HardDrive, Zap, Layers } from "lucide-react";

interface NodeStatus {
  id: string;
  name: string;
  cpu: number;
  memory: number;
  network: number;
  status: "healthy" | "warning" | "critical";
  lastPing: number;
}

export function ResourceUtilizationMap() {
  const [nodes, setNodes] = useState<NodeStatus[]>([]);

  // Initialize nodes
  useEffect(() => {
    const initialNodes: NodeStatus[] = Array.from({ length: 12 }).map((_, i) => ({
      id: `0x${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
      name: `Sentinel-Edge-${String(i + 1).padStart(2, '0')}`,
      cpu: Math.random() * 40 + 20,
      memory: Math.random() * 30 + 40,
      network: Math.random() * 50 + 10,
      status: "healthy",
      lastPing: Date.now(),
    }));
    setNodes(initialNodes);

    const interval = setInterval(() => {
      setNodes(prev => prev.map(node => {
        const cpuDelta = (Math.random() - 0.5) * 8;
        const memDelta = (Math.random() - 0.5) * 4;
        const netDelta = (Math.random() - 0.5) * 10;
        
        const newCpu = Math.max(10, Math.min(98, node.cpu + cpuDelta));
        const newMem = Math.max(10, Math.min(98, node.memory + memDelta));
        const newNet = Math.max(5, Math.min(100, node.network + netDelta));
        
        let status: NodeStatus["status"] = "healthy";
        if (newCpu > 90 || newMem > 90) status = "critical";
        else if (newCpu > 75 || newMem > 75) status = "warning";

        return {
          ...node,
          cpu: newCpu,
          memory: newMem,
          network: newNet,
          status,
          lastPing: Date.now(),
        };
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary" />
           </div>
           <div>
              <h3 className="text-sm font-black uppercase tracking-widest italic">Cluster <span className="text-primary">Topology</span></h3>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Vector Resource Distribution Map</p>
           </div>
        </div>
        <div className="flex gap-6">
          <LegendItem label="Nominal" color="bg-emerald-500" />
          <LegendItem label="Throttled" color="bg-amber-500" />
          <LegendItem label="Saturated" color="bg-rose-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {nodes.map((node) => (
          <div 
            key={node.id}
            className={cn(
              "p-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group relative overflow-hidden",
              node.status === "critical" && "border-rose-500/20 bg-rose-500/5 shadow-[inset_0_0_20px_rgba(244,63,94,0.05)]",
              node.status === "warning" && "border-amber-500/20 bg-amber-500/5"
            )}
          >
            {/* Status Indicator Bar */}
            <div className={cn(
              "absolute top-0 left-0 w-full h-1 opacity-40 group-hover:opacity-100 transition-opacity",
              node.status === "healthy" ? "bg-primary" : 
              node.status === "warning" ? "bg-amber-500" : "bg-rose-500"
            )} />

            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-black font-mono text-muted-foreground/60">{node.id}</span>
              <div className="flex gap-1">
                 <div className={cn("h-1.5 w-1.5 rounded-full", node.cpu > 70 ? "bg-rose-500" : "bg-primary/40")} />
                 <div className={cn("h-1.5 w-1.5 rounded-full", node.memory > 70 ? "bg-rose-500" : "bg-primary/40")} />
              </div>
            </div>

            <p className="text-[10px] font-black italic mb-6 truncate uppercase tracking-tighter group-hover:text-primary transition-colors">{node.name}</p>

            <div className="space-y-4">
               <StatBar label="Neural CPU" value={node.cpu} color="bg-primary" />
               <StatBar label="Memory" value={node.memory} color="bg-accent" />
               <StatBar label="Network" value={node.network} color="bg-blue-500" />
            </div>

            {/* Micro-activity line */}
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity">
               <span className="text-[8px] font-black uppercase tracking-widest">Active Link</span>
               <Activity className="h-3 w-3 text-primary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendItem({ label, color }: { label: string, color: string }) {
   return (
      <div className="flex items-center gap-2">
         <div className={cn("h-2 w-2 rounded-full", color)} />
         <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{label}</span>
      </div>
   )
}

function StatBar({ label, value, color }: { label: string, value: number, color: string }) {
   return (
      <div className="space-y-1.5">
         <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
            <span>{label}</span>
            <span>{value.toFixed(0)}%</span>
         </div>
         <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-1000", color)}
              style={{ width: `${value}%` }} 
            />
         </div>
      </div>
   )
}
