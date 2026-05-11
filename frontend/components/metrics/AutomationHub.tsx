"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Play, 
  Settings, 
  Shield, 
  Cpu, 
  Zap, 
  RefreshCcw, 
  Activity,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Terminal,
  Server
} from "lucide-react";
import { useSentinelOps } from "@/lib/hooks/useSentinelOps";

interface Workflow {
  id: string;
  name: string;
  status: "active" | "idle" | "error";
  lastRun: string;
  successRate: number;
  description: string;
  module: "Analytics" | "Security" | "Storage" | "Cluster";
  op?: string;
}

const WORKFLOWS: Workflow[] = [
  {
    id: "wf-1",
    name: "Neural Aggregation Pipeline",
    status: "active",
    lastRun: "2m ago",
    successRate: 99.9,
    description: "Aggregates telemetry from 12 edge nodes into the central analytics engine.",
    module: "Analytics",
    op: "rebalance"
  },
  {
    id: "wf-2",
    name: "Automated Threat Mitigation",
    status: "idle",
    lastRun: "4h ago",
    successRate: 100,
    description: "Detects and blocks anomalous inference requests based on behavioral patterns.",
    module: "Security",
    op: "audit"
  },
  {
    id: "wf-3",
    name: "Edge-Node Sync Protocol",
    status: "active",
    lastRun: "30s ago",
    successRate: 98.4,
    description: "Synchronizes local model weights and cache across the global sentinel cluster.",
    module: "Cluster",
    op: "recalibrate"
  },
  {
    id: "wf-4",
    name: "Cold Storage Compression",
    status: "idle",
    lastRun: "1d ago",
    successRate: 100,
    description: "Automatically compresses and moves logs older than 7 days to archival storage.",
    module: "Storage",
    op: "export"
  },
];

export function AutomationHub() {
  const { execute, loading } = useSentinelOps();
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);

  const handleRun = async (wf: Workflow) => {
    setActiveWorkflow(wf.id);
    if (wf.op) {
      await execute(wf.op as any);
    }
    setTimeout(() => setActiveWorkflow(null), 2000);
  };

  return (
    <div className="space-y-10">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatusCard title="Active Automations" value="14" icon={<Zap className="text-primary" />} trend="+2 new" />
        <StatusCard title="Global Efficiency" value="99.2%" icon={<CheckCircle2 className="text-emerald-500" />} trend="Optimal" />
        <StatusCard title="Protocol Count" value="48" icon={<Cpu className="text-blue-500" />} trend="Across nodes" />
        <StatusCard title="Worker Load" value="24%" icon={<Activity className="text-primary" />} trend="Nominal" />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                 <Server className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-black tracking-tighter uppercase italic">Workflow <span className="text-primary">Orchestration</span></h2>
           </div>
           <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
             <Settings className="h-3.5 w-3.5 opacity-40" /> Cluster Config
           </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {WORKFLOWS.map((wf) => (
            <div key={wf.id} className="creative-card p-6 flex gap-6 group hover:border-primary/20 bg-black/20 border-white/5">
              <div className={cn(
                "h-20 w-20 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-105",
                wf.status === "active" ? "border-primary/20 bg-primary/5" : "border-white/5 bg-white/5",
                wf.id === activeWorkflow && "sentinel-pulse border-primary/60 bg-primary/20"
              )}>
                 {wf.id === activeWorkflow ? (
                   <Loader2 className="h-8 w-8 text-primary animate-spin" />
                 ) : (
                   <>
                     {wf.module === "Analytics" && <Activity className={cn("h-8 w-8", wf.status === "active" ? "text-primary" : "text-muted-foreground/40")} />}
                     {wf.module === "Security" && <Shield className={cn("h-8 w-8", wf.status === "active" ? "text-primary" : "text-muted-foreground/40")} />}
                     {wf.module === "Cluster" && <Cpu className={cn("h-8 w-8", wf.status === "active" ? "text-primary" : "text-muted-foreground/40")} />}
                     {wf.module === "Storage" && <RefreshCcw className={cn("h-8 w-8", wf.status === "active" ? "text-primary" : "text-muted-foreground/40")} />}
                   </>
                 )}
              </div>

              <div className="flex-1 space-y-2">
                 <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{wf.module} Module</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                       <div className={cn("h-1.5 w-1.5 rounded-full", wf.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/20")} />
                       <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">{wf.status}</span>
                    </div>
                 </div>
                 <h3 className="text-lg font-black italic tracking-tighter group-hover:text-primary transition-colors uppercase">{wf.name}</h3>
                 <p className="text-[11px] text-muted-foreground font-medium leading-relaxed line-clamp-2 italic">{wf.description}</p>
                 
                 <div className="flex items-center justify-between pt-4">
                    <div className="flex gap-8">
                       <div className="space-y-0.5">
                          <p className="text-[8px] font-black uppercase text-muted-foreground/30 tracking-widest">Last Cycle</p>
                          <p className="text-[10px] font-black italic">{wf.lastRun.toUpperCase()}</p>
                       </div>
                       <div className="space-y-0.5">
                          <p className="text-[8px] font-black uppercase text-muted-foreground/30 tracking-widest">Integrity</p>
                          <p className="text-[10px] font-black text-emerald-500 italic">{wf.successRate}%</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => handleRun(wf)}
                      disabled={wf.id === activeWorkflow}
                      className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                    >
                       <Play className="h-3.5 w-3.5 fill-current" />
                    </button>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="creative-card space-y-6 bg-black/40 border-white/5 shadow-2xl">
         <h3 className="text-sm font-black uppercase tracking-tighter italic">Data Flow <span className="text-primary">Automation Pipeline</span></h3>
         <div className="relative h-40 w-full border border-white/5 rounded-3xl bg-white/[0.02] overflow-hidden px-12 py-6">
            <div className="absolute inset-0 opacity-10 digital-grid" />
            
            <div className="relative z-10 flex items-center justify-between h-full max-w-5xl mx-auto">
               <PipelineNode label="Edge Cluster" icon={<Cpu className="h-5 w-5" />} status="sending" />
               <PipelineConnector active />
               <PipelineNode label="Sync Worker" icon={<RefreshCcw className="h-5 w-5" />} status="processing" />
               <PipelineConnector active />
               <PipelineNode label="Analytics DB" icon={<Activity className="h-5 w-5" />} status="idle" />
               <PipelineConnector />
               <PipelineNode label="Neural UI" icon={<Zap className="h-5 w-5" />} status="idle" />
            </div>
         </div>
      </div>
    </div>
  );
}

function StatusCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="creative-card p-6 bg-black/20 border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
          {icon}
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{trend}</span>
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-1">{title}</p>
      <p className="text-3xl font-black italic tracking-tighter uppercase">{value}</p>
    </div>
  );
}

function PipelineNode({ label, icon, status }: { label: string, icon: React.ReactNode, status: "idle" | "processing" | "sending" }) {
  return (
    <div className="flex flex-col items-center gap-3">
       <div className={cn(
         "h-14 w-14 rounded-2xl border bg-black/40 flex items-center justify-center relative transition-all duration-500 shadow-xl",
         status === "idle" ? "border-white/10" : "border-primary/40 sentinel-pulse",
         status === "processing" && "scale-110"
       )}>
          <div className={cn("transition-colors", status !== "idle" ? "text-primary" : "text-muted-foreground/20")}>
             {icon}
          </div>
          {status !== "idle" && (
            <div className={cn(
              "absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-4 border-[#050505]",
              status === "sending" ? "bg-primary animate-pulse" : "bg-blue-400 animate-spin"
            )} />
          )}
       </div>
       <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</span>
    </div>
  );
}

function PipelineConnector({ active }: { active?: boolean }) {
  return (
    <div className="flex-1 px-4 relative">
       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          {active && (
            <div className="h-full w-full bg-gradient-to-r from-primary/10 to-primary animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          )}
       </div>
    </div>
  );
}
