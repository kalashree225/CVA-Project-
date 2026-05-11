import { SystemHealthCore } from "@/components/metrics/SystemHealthCore";
import { DeepAnalyticsMonitor } from "@/components/metrics/DeepAnalyticsMonitor";
import { IntelligenceFeed } from "@/components/metrics/IntelligenceFeed";
import { PacketInspector } from "@/components/metrics/PacketInspector";
import { LiveMetricsPanel } from "@/components/metrics/LiveMetricsPanel";
import { ResourceUtilizationMap } from "@/components/metrics/ResourceUtilizationMap";
import { SentinelAnalyticsExplorer } from "@/components/metrics/SentinelAnalyticsExplorer";
import { AutomationHub } from "@/components/metrics/AutomationHub";
import { NeuralStrategyOptimizer } from "@/components/metrics/NeuralStrategyOptimizer";
import { RiskDensityMap } from "@/components/metrics/RiskDensityMap";
import { Button } from "@/components/ui/Button";
import { Download, Filter, ChevronRight, Share2, Plus, Loader2, Activity, Shield, Zap, LayoutDashboard, BrainCircuit, BarChart3 } from "lucide-react";
import { useSentinelOps } from "@/lib/hooks/useSentinelOps";
import { useAuthStore } from "@/lib/store/auth";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { execute, loading } = useSentinelOps();
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6 pb-20 relative">
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center">
           <div className="bg-card p-10 rounded-3xl shadow-2xl border border-white/10 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
              <div className="h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <div className="text-center">
                <p className="text-lg font-black uppercase tracking-tighter italic text-white">Neural <span className="text-primary">Recalibration</span></p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Executing requested kernel protocol...</p>
              </div>
           </div>
        </div>
      )}

      {/* Header Section */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <LayoutDashboard className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sentinel Command Center // Version 2.0.5</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">
            Intelligence <span className="animate-gradient-text text-primary">Overview</span>
          </h1>
          <p className="text-muted-foreground text-xs mt-1 font-medium italic opacity-70">Authenticated as: <span className="text-foreground font-black">{user?.full_name}</span> // Active Cluster: GLOBAL_SENTINEL_01</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-6 mr-6">
             <HeaderStat label="Status" value="Operational" color="text-success" />
             <HeaderStat label="Neural Load" value="84.2%" color="text-primary" />
             <HeaderStat label="Uptime" value="142d 12h" color="text-muted-foreground" />
          </div>
          <Button variant="outline" size="sm" className="gap-2 h-10 border-white/5 bg-white/5 hover:bg-white/10" onClick={() => execute("rebalance")}>
            <Filter className="h-4 w-4" /> Rebalance
          </Button>
          <Button size="sm" className="gap-2 h-10 bg-primary hover:bg-primary/90 text-primary-foreground border-none font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> New Analysis
          </Button>
        </div>
      </header>

      {/* Real-time Metrics Panel */}
      <section className="animate-in fade-in slide-in-from-top-4 duration-500">
        <LiveMetricsPanel />
      </section>

      {/* Primary Intelligence Cluster */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Span: Strategic Analysis & Decision Tools */}
        <div className="xl:col-span-3 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="creative-card p-0 overflow-hidden bg-black/40 border-white/5 flex flex-col">
              <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-primary" />
                  <h2 className="text-xs font-black uppercase tracking-widest italic">Neural <span className="text-primary">Strategy Optimizer</span></h2>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                   <span className="text-[8px] font-black uppercase text-primary tracking-widest">Decision Support</span>
                </div>
              </div>
              <div className="p-6 flex-1">
                <NeuralStrategyOptimizer />
              </div>
            </section>

            <section className="creative-card p-0 overflow-hidden bg-black/40 border-white/5 flex flex-col">
              <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-accent" />
                  <h2 className="text-xs font-black uppercase tracking-widest italic">Risk <span className="text-accent">Density Map</span></h2>
                </div>
                <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest opacity-40">Temporal Distribution</span>
              </div>
              <div className="p-6 flex-1">
                <RiskDensityMap />
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <section className="lg:col-span-1 creative-card p-0 overflow-hidden bg-black/40 border-white/5">
                <div className="px-6 py-4 border-b border-white/5 bg-white/5">
                   <h2 className="text-xs font-black uppercase tracking-widest italic flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" /> System <span className="text-primary">Health</span>
                   </h2>
                </div>
                <div className="p-6">
                   <SystemHealthCore />
                </div>
             </section>

             <section className="lg:col-span-2 creative-card p-0 overflow-hidden bg-black/40 border-white/5">
                <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <h2 className="text-xs font-black uppercase tracking-widest italic">Sentinel <span className="text-primary">Automation Hub</span></h2>
                  </div>
                  <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-4">Configure Protocols</button>
                </div>
                <div className="p-8">
                  <AutomationHub />
                </div>
              </section>
          </div>
        </div>

        {/* Right Span: Live Feed & Quick Ops */}
        <div className="space-y-6">
          <IntelligenceFeed />

          <section className="creative-card bg-black/40 border-white/5">
            <h3 className="text-xs font-black uppercase tracking-widest italic mb-6 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Quick <span className="text-primary">Operations</span>
            </h3>
            <div className="space-y-3">
              <OpButton label="Run Security Audit" onClick={() => execute("audit")} />
              <OpButton label="Recalibrate Hardware" onClick={() => execute("recalibrate")} />
              <OpButton label="Emergency Isolation" variant="danger" onClick={() => execute("emergency_isolation")} />
            </div>
          </section>

          <section className="creative-card bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Platform Alert</h4>
             <p className="text-xs font-medium leading-relaxed italic text-foreground/80">
                Operational status verified. No critical hardware anomalies detected. System is operating at peak efficiency with Neural Strategy optimized for <span className="text-primary font-bold">Cost-Efficiency</span>.
             </p>
          </section>
        </div>
      </div>

      {/* Secondary Deep Analytics & Topology */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
         <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-xl font-black tracking-tighter uppercase italic flex items-center gap-2">
               <Zap className="h-5 w-5 text-primary" /> Deep <span className="text-primary">Neural Intelligence</span>
            </h2>
            <DeepAnalyticsMonitor />
         </section>

         <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-xl font-black tracking-tighter uppercase italic flex items-center gap-2">
               <LayoutDashboard className="h-5 w-5 text-primary" /> Cluster <span className="text-primary">Topology Overview</span>
            </h2>
            <div className="creative-card bg-black/40 border-white/5 p-8 h-full">
               <ResourceUtilizationMap />
            </div>
         </section>
      </div>

      {/* Global Inspector */}
      <PacketInspector />
    </div>
  );
}

function HeaderStat({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="flex flex-col items-end">
       <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">{label}</span>
       <span className={cn("text-xs font-black italic uppercase", color)}>{value}</span>
    </div>
  )
}

function OpButton({ label, onClick, variant = "default" }: any) {
  return (
    <Button 
      onClick={onClick}
      className={cn(
        "w-full justify-between text-[10px] font-black uppercase tracking-widest h-11 transition-all rounded-xl border border-white/5",
        variant === "danger" ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20" : "bg-white/5 text-foreground hover:bg-white/10"
      )} 
      variant="outline"
    >
      {label} <ChevronRight className="h-3.5 w-3.5 opacity-40" />
    </Button>
  )
}
