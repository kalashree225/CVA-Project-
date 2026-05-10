"use client";

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
  AlertTriangle
} from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  status: "active" | "idle" | "error";
  lastRun: string;
  successRate: number;
  description: string;
  module: "Analytics" | "Security" | "Storage" | "Cluster";
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
  },
  {
    id: "wf-2",
    name: "Automated Threat Mitigation",
    status: "idle",
    lastRun: "4h ago",
    successRate: 100,
    description: "Detects and blocks anomalous inference requests based on behavioral patterns.",
    module: "Security",
  },
  {
    id: "wf-3",
    name: "Edge-Node Sync Protocol",
    status: "active",
    lastRun: "30s ago",
    successRate: 98.4,
    description: "Synchronizes local model weights and cache across the global sentinel cluster.",
    module: "Cluster",
  },
  {
    id: "wf-4",
    name: "Cold Storage Compression",
    status: "idle",
    lastRun: "1d ago",
    successRate: 100,
    description: "Automatically compresses and moves logs older than 7 days to archival storage.",
    module: "Storage",
  },
];

export function AutomationHub() {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatusCard title="Active Automations" value="14" icon={<Zap className="text-primary" />} trend="+2 new today" />
        <StatusCard title="Success Rate" value="99.2%" icon={<CheckCircle2 className="text-success" />} trend="Nominal" />
        <StatusCard title="Total Workflows" value="48" icon={<Cpu className="text-accent" />} trend="across 4 modules" />
        <StatusCard title="System Load" value="24%" icon={<Activity className="text-primary" />} trend="-4% decrease" />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h2 className="text-2xl font-black tracking-tighter uppercase italic">Workflow <span className="text-primary">Orchestration</span></h2>
           <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
             <Settings className="h-4 w-4" /> Global Settings
           </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {WORKFLOWS.map((wf) => (
            <div key={wf.id} className="creative-card flex gap-6 group hover:border-primary/30">
              <div className={cn(
                "h-20 w-20 rounded-2xl flex items-center justify-center border-2 border-white/5 bg-white/5 shrink-0 transition-transform group-hover:scale-105",
                wf.status === "active" && "border-primary/20 bg-primary/5",
                wf.status === "error" && "border-rose-500/20 bg-rose-500/5"
              )}>
                 {wf.module === "Analytics" && <Activity className={cn("h-8 w-8", wf.status === "active" ? "text-primary" : "text-muted-foreground")} />}
                 {wf.module === "Security" && <Shield className={cn("h-8 w-8", wf.status === "active" ? "text-primary" : "text-muted-foreground")} />}
                 {wf.module === "Cluster" && <Cpu className={cn("h-8 w-8", wf.status === "active" ? "text-primary" : "text-muted-foreground")} />}
                 {wf.module === "Storage" && <RefreshCcw className={cn("h-8 w-8", wf.status === "active" ? "text-primary" : "text-muted-foreground")} />}
              </div>

              <div className="flex-1 space-y-2">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{wf.module} Module</span>
                    <div className="flex items-center gap-1.5">
                       <div className={cn("h-1.5 w-1.5 rounded-full", wf.status === "active" ? "bg-success animate-pulse" : wf.status === "idle" ? "bg-muted-foreground" : "bg-rose-500")} />
                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{wf.status}</span>
                    </div>
                 </div>
                 <h3 className="text-lg font-black italic tracking-tight group-hover:text-primary transition-colors">{wf.name}</h3>
                 <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{wf.description}</p>
                 
                 <div className="flex items-center justify-between pt-4">
                    <div className="flex gap-6">
                       <div className="space-y-0.5">
                          <p className="text-[9px] font-black uppercase text-muted-foreground">Last Run</p>
                          <p className="text-xs font-bold">{wf.lastRun}</p>
                       </div>
                       <div className="space-y-0.5">
                          <p className="text-[9px] font-black uppercase text-muted-foreground">Success Rate</p>
                          <p className="text-xs font-bold text-success">{wf.successRate}%</p>
                       </div>
                    </div>
                    <button className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Play className="h-4 w-4 fill-current" />
                    </button>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Automated Pipeline Visualization */}
      <div className="creative-card space-y-6">
         <h3 className="text-lg font-black uppercase tracking-tighter italic">Data Flow <span className="text-accent">Automation</span></h3>
         <div className="relative h-48 w-full border border-white/5 rounded-2xl bg-black/40 overflow-hidden p-8">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--accent) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            
            <div className="relative z-10 flex items-center justify-between h-full max-w-4xl mx-auto">
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
    <div className="creative-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{trend}</span>
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
      <p className="text-3xl font-black italic tracking-tighter">{value}</p>
    </div>
  );
}

function PipelineNode({ label, icon, status }: { label: string, icon: React.ReactNode, status: "idle" | "processing" | "sending" }) {
  return (
    <div className="flex flex-col items-center gap-3">
       <div className={cn(
         "h-14 w-14 rounded-2xl border border-white/10 bg-card flex items-center justify-center relative",
         status === "processing" && "border-accent/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]",
         status === "sending" && "border-primary/50 shadow-[0_0_20px_rgba(14,165,233,0.3)]"
       )}>
          {icon}
          {status !== "idle" && (
            <div className={cn(
              "absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-background",
              status === "sending" ? "bg-primary animate-pulse" : "bg-accent animate-spin"
            )} />
          )}
       </div>
       <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
  );
}

function PipelineConnector({ active }: { active?: boolean }) {
  return (
    <div className="flex-1 px-4 relative">
       <div className="h-0.5 w-full bg-white/5 rounded-full" />
       {active && (
         <div className="absolute top-0 left-0 h-0.5 w-full bg-gradient-to-r from-primary to-accent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
       )}
    </div>
  );
}
