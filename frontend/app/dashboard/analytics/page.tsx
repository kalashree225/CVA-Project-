import { 
  BarChart3, 
  TrendingUp, 
  Layers, 
  Cpu, 
  Zap, 
  Activity, 
  Globe, 
  Shield, 
  Clock, 
  ChevronRight,
  Filter,
  Download,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const [selectedModel, setSelectedModel] = useState("llava-1.5");
  const [timeRange, setTimeRange] = useState(24);
  const [stats, setStats] = useState<any>(null);
  const [trend, setTrend] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedModel, timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [statsData, trendData, comparisonData] = await Promise.all([
        apiClient.get("/api/v1/analytics/statistical-summary", {
          model_name: selectedModel,
          hours: timeRange,
        }),
        apiClient.get("/api/v1/analytics/trend-analysis", {
          metric: "latency_ms",
          model_name: selectedModel,
          hours: timeRange * 7,
        }),
        apiClient.get("/api/v1/analytics/model-comparison", {
          models: ["llava-1.5", "gpt-4-vision"],
          hours: timeRange,
        }),
      ]);

      setStats(statsData);
      setTrend(trendData);
      setComparison(comparisonData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Dynamic Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Analytical Engine // Deep Cluster Analysis</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic">
            Deep <span className="animate-gradient-text">Intelligence</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              {["overview", "trends", "comparison"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                    activeTab === tab ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
           </div>
          <Button variant="outline" size="md" className="gap-2 border-white/5 bg-white/5 hover:bg-white/10">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>
      </header>

      {/* Control Panel */}
      <section className="creative-card p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-black/40 border-white/5">
         <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
               <Cpu className="h-3 w-3 text-primary" />
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Neural Model</label>
            </div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-black italic outline-none focus:border-primary/50 appearance-none transition-all"
            >
              <option value="llava-1.5" className="bg-card">LLaVA 1.5 - Vision Optimized</option>
              <option value="gpt-4-vision" className="bg-card">GPT-4 Vision - Enterprise</option>
              <option value="claude-3-opus" className="bg-card">Claude 3 Opus - Synthetic</option>
            </select>
         </div>
         <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
               <Calendar className="h-3 w-3 text-primary" />
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Temporal Window</label>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-black italic outline-none focus:border-primary/50 appearance-none transition-all"
            >
              <option value="6" className="bg-card">Last 06 Hours - Realtime</option>
              <option value="24" className="bg-card">Last 24 Hours - Daily Aggregate</option>
              <option value="168" className="bg-card">Last 07 Days - Weekly Trend</option>
            </select>
         </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
           <div className="h-16 w-16 rounded-full border-4 border-white/5 border-t-primary animate-spin" />
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Computing Deep Metrics...</p>
        </div>
      ) : (
        <div className="space-y-12 animate-in fade-in duration-700">
          {activeTab === "overview" && stats && (
            <div className="space-y-12">
               {/* Primary Stats Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <StatCard 
                    title="Total Processed" 
                    value={stats.total_runs} 
                    format="number" 
                    icon={<Activity className="h-4 w-4" />}
                    trend="+12.4%"
                  />
                  <StatCard 
                    title="Mean Latency" 
                    value={stats.metrics?.latency_ms?.mean || 0} 
                    format="duration" 
                    icon={<Clock className="h-4 w-4" />}
                    trend="-210ms"
                    trendColor="success"
                  />
                  <StatCard 
                    title="Operational Cost" 
                    value={stats.metrics?.cost_usd?.mean || 0} 
                    format="currency" 
                    icon={<DollarSign className="h-4 w-4" />}
                    trend="+0.02%"
                    trendColor="warning"
                  />
                  <StatCard 
                    title="Hallucination Index" 
                    value={stats.metrics?.hallucination_score?.mean || 0} 
                    format="score" 
                    icon={<Shield className="h-4 w-4" />}
                    trend="-0.04"
                    trendColor="success"
                  />
               </div>

               {/* Latency Distribution Radar */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 creative-card">
                     <div className="flex items-center justify-between mb-8">
                        <div>
                           <h3 className="text-xl font-black tracking-tighter uppercase italic">Latency <span className="text-primary">Distribution</span></h3>
                           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">P-Percentile Oscillations</p>
                        </div>
                        <BarChart3 className="h-5 w-5 text-primary opacity-50" />
                     </div>
                     
                     <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        {[
                          { label: "P25", value: stats.metrics.latency_ms.p25, color: "primary" },
                          { label: "P50", value: stats.metrics.latency_ms.p50, color: "primary" },
                          { label: "P75", value: stats.metrics.latency_ms.p75, color: "primary" },
                          { label: "P90", value: stats.metrics.latency_ms.p90, color: "accent" },
                          { label: "P95", value: stats.metrics.latency_ms.p95, color: "rose-500" },
                        ].map((p) => (
                          <div key={p.label} className="group relative overflow-hidden p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all">
                             <div className="text-2xl font-black italic tracking-tighter group-hover:scale-110 transition-transform">
                               {p.value?.toFixed(0)}<span className="text-xs ml-0.5">ms</span>
                             </div>
                             <div className={cn("text-[9px] font-black uppercase tracking-widest mt-1", `text-${p.color}`)}>
                               {p.label} Interval
                             </div>
                             <div className={cn("absolute bottom-0 left-0 h-1 w-full bg-white/10 group-hover:bg-primary transition-colors")} />
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="creative-card flex flex-col justify-between">
                     <div className="mb-6">
                        <h3 className="text-xl font-black tracking-tighter uppercase italic">Statistical <span className="text-accent">Variance</span></h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Standard Deviation Trace</p>
                     </div>
                     
                     <div className="space-y-4">
                        <VarianceRow label="Mean Dev" value={stats.metrics.latency_ms.std_dev?.toFixed(2)} unit="ms" />
                        <VarianceRow label="Min Floor" value={stats.metrics.latency_ms.min?.toFixed(2)} unit="ms" />
                        <VarianceRow label="Max Ceiling" value={stats.metrics.latency_ms.max?.toFixed(2)} unit="ms" />
                     </div>

                     <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                           <Shield className="h-3 w-3 text-success" /> Confidence Level: 99.4%
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === "trends" && trend && (
            <div className="space-y-12">
               <div className="creative-card p-12 bg-black/60">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                     <div>
                        <div className={cn(
                           "text-5xl font-black italic tracking-tighter mb-2",
                           trend.trend === "Up" ? "text-rose-500" : "text-success"
                        )}>
                           {trend.trend === "Up" ? "↑" : "↓"} {trend.change_percent?.toFixed(1)}%
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Temporal Shift</p>
                     </div>
                     <div className="border-x border-white/5">
                        <div className="text-5xl font-black italic tracking-tighter mb-2 text-primary">
                           {trend.confidence?.toFixed(2)}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Neural Confidence</p>
                     </div>
                     <div>
                        <div className="text-5xl font-black italic tracking-tighter mb-2">
                           {trend.data_points}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vector Data Points</p>
                     </div>
                  </div>
               </div>

               <div className="creative-card p-0 overflow-hidden">
                  <div className="bg-white/5 px-8 py-6 flex items-center justify-between">
                     <h3 className="text-xl font-black tracking-tighter uppercase italic">Oscillation <span className="text-primary">Timeline</span></h3>
                     <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div className="h-[400px] w-full flex items-center justify-center bg-black/20 italic text-muted-foreground text-xs uppercase tracking-widest">
                     [ Adaptive Trend Component Rendering... ]
                  </div>
               </div>
            </div>
          )}

          {activeTab === "comparison" && comparison && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-8">
                  {Object.entries(comparison.models || {}).map(([model, data]: [string, any]) => (
                    <div key={model} className="creative-card group hover:border-primary/40 transition-all">
                       <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                             <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary/10 transition-colors">
                                <Layers className="h-5 w-5 text-primary" />
                             </div>
                             <h4 className="text-lg font-black italic tracking-tight">{model}</h4>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="text-right">
                                <p className="text-[9px] font-black uppercase text-muted-foreground">Throughput</p>
                                <p className="text-sm font-black italic">{data.total_runs} PKTS</p>
                             </div>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <MetricBox label="Avg Latency" value={data.metrics?.latency_ms?.mean?.toFixed(0)} unit="ms" color="primary" />
                          <MetricBox label="Avg Cost" value={data.metrics?.cost_usd?.mean?.toFixed(4)} unit="$" color="accent" />
                          <MetricBox label="Hallucination" value={data.metrics?.hallucination_score?.mean?.toFixed(3)} unit="" color="rose-500" />
                       </div>
                    </div>
                  ))}
               </div>

               <div className="space-y-8">
                  <div className="creative-card bg-primary/5 border-primary/20">
                     <h3 className="text-lg font-black tracking-tighter uppercase italic mb-6">Leaderboard <span className="text-primary">Rankings</span></h3>
                     <div className="space-y-6">
                        <RankRow label="Fastest Engine" value={comparison.rankings?.fastest} icon={<Zap className="h-4 w-4 text-primary" />} />
                        <RankRow label="Cost Optimized" value={comparison.rankings?.cheapest} icon={<DollarSign className="h-4 w-4 text-success" />} />
                        <RankRow label="Precision Core" value={comparison.rankings?.most_accurate} icon={<Shield className="h-4 w-4 text-accent" />} />
                     </div>
                  </div>
                  
                  <div className="creative-card bg-black/40 border-white/5">
                     <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 italic">Sentinel Insight</p>
                     <p className="text-xs text-foreground leading-relaxed italic font-medium">
                        "The current delta between LLaVA and GPT-4 indicates a 24% efficiency gap in visual tokenization. Recommend scaling Cluster-02 for synthetic workloads."
                     </p>
                  </div>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, format, icon, trend, trendColor = "primary" }: any) {
  const formatValue = (val: number) => {
    switch (format) {
      case "number": return val.toLocaleString();
      case "duration": return `${val.toFixed(0)}ms`;
      case "currency": return `$${val.toFixed(4)}`;
      case "score": return val.toFixed(3);
      default: return val.toString();
    }
  };

  return (
    <div className="creative-card group hover:border-primary/40 transition-all">
      <div className="flex items-center justify-between mb-4">
         <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary/10 transition-colors">
            {icon}
         </div>
         {trend && (
            <span className={cn(
               "text-[10px] font-black px-2 py-0.5 rounded-full",
               trendColor === "success" ? "bg-emerald-500/10 text-emerald-500" : 
               trendColor === "warning" ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
            )}>
               {trend}
            </span>
         )}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
      <p className="text-3xl font-black italic tracking-tighter text-foreground">{formatValue(value)}</p>
    </div>
  );
}

function VarianceRow({ label, value, unit }: any) {
   return (
      <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
         <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
         <span className="text-sm font-black italic">{value}{unit}</span>
      </div>
   )
}

function MetricBox({ label, value, unit, color }: any) {
   return (
      <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
         <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
         <p className={cn("text-base font-black italic tracking-tighter", `text-${color}`)}>{value}{unit}</p>
      </div>
   )
}

function RankRow({ label, value, icon }: any) {
   return (
      <div className="flex items-center gap-4">
         <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            {icon}
         </div>
         <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="text-sm font-black italic text-foreground tracking-tight">{value || "Awaiting Data"}</p>
         </div>
      </div>
   )
}
