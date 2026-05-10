"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Cpu, Database, Activity, HardDrive } from "lucide-react";

interface NodeStatus {
  id: string;
  name: string;
  cpu: number;
  memory: number;
  status: "healthy" | "warning" | "critical";
  lastPing: number;
}

export function ResourceUtilizationMap() {
  const [nodes, setNodes] = useState<NodeStatus[]>([]);

  // Initialize nodes
  useEffect(() => {
    const initialNodes: NodeStatus[] = Array.from({ length: 12 }).map((_, i) => ({
      id: `node-${i + 1}`,
      name: `Sentinel-Edge-${String(i + 1).padStart(2, '0')}`,
      cpu: Math.random() * 40 + 20,
      memory: Math.random() * 30 + 40,
      status: "healthy",
      lastPing: Date.now(),
    }));
    setNodes(initialNodes);

    const interval = setInterval(() => {
      setNodes(prev => prev.map(node => {
        const cpuDelta = (Math.random() - 0.5) * 5;
        const memDelta = (Math.random() - 0.5) * 2;
        const newCpu = Math.max(10, Math.min(95, node.cpu + cpuDelta));
        const newMem = Math.max(10, Math.min(95, node.memory + memDelta));
        
        let status: NodeStatus["status"] = "healthy";
        if (newCpu > 85 || newMem > 85) status = "critical";
        else if (newCpu > 70 || newMem > 70) status = "warning";

        return {
          ...node,
          cpu: newCpu,
          memory: newMem,
          status,
          lastPing: Date.now(),
        };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="creative-card flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tighter italic">
            Cluster <span className="text-primary">Topology</span>
          </h3>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Edge Node Resource Distribution</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-[10px] font-black uppercase text-muted-foreground">Stable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[10px] font-black uppercase text-muted-foreground">Throttling</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-[10px] font-black uppercase text-muted-foreground">Critical</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {nodes.map((node) => (
          <div 
            key={node.id}
            className={cn(
              "p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group relative overflow-hidden",
              node.status === "critical" && "border-rose-500/30 bg-rose-500/5",
              node.status === "warning" && "border-amber-500/30 bg-amber-500/5"
            )}
          >
            {/* Status Indicator Bar */}
            <div className={cn(
              "absolute top-0 left-0 w-full h-0.5",
              node.status === "healthy" ? "bg-primary" : 
              node.status === "warning" ? "bg-amber-500" : "bg-rose-500"
            )} />

            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black font-mono text-muted-foreground">{node.id.toUpperCase()}</span>
              <Activity className={cn("h-3 w-3", node.status === "critical" ? "text-rose-500 animate-pulse" : "text-muted-foreground")} />
            </div>

            <p className="text-xs font-bold mb-4 truncate group-hover:text-primary transition-colors">{node.name}</p>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-black uppercase">
                  <span>CPU</span>
                  <span>{node.cpu.toFixed(0)}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      node.cpu > 80 ? "bg-rose-500" : node.cpu > 60 ? "bg-amber-500" : "bg-primary"
                    )}
                    style={{ width: `${node.cpu}%` }} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-black uppercase">
                  <span>RAM</span>
                  <span>{node.memory.toFixed(0)}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      node.memory > 80 ? "bg-rose-500" : node.memory > 60 ? "bg-amber-500" : "bg-accent"
                    )}
                    style={{ width: `${node.memory}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
