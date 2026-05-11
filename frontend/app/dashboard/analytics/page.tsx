"use client";

import { useEffect, useState } from "react";
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
  DollarSign,
  ChevronRight,
  Filter,
  Download,
  Calendar,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";

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
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Deep Intelligence</h1>
          <p className="text-muted-foreground text-sm mt-1">Comprehensive statistical analysis of neural cluster performance.</p>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex bg-secondary/50 border border-border rounded-lg p-1">
              {["overview", "trends", "comparison"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-1.5 text-xs font-semibold rounded-md transition-all",
                    activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
           </div>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </header>

      {/* Control Panel */}
      <section className="pro-card p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Target Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm font-semibold outline-none focus:ring-1 focus:ring-primary/20 appearance-none transition-all"
            >
              <option value="llava-1.5">LLaVA 1.5 - Optimized</option>
              <option value="gpt-4-vision">GPT-4 Vision - Enterprise</option>
              <option value="claude-3-opus">Claude 3 Opus - Synthetic</option>
            </select>
         </div>
         <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Temporal Window</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm font-semibold outline-none focus:ring-1 focus:ring-primary/20 appearance-none transition-all"
            >
              <option value="6">Last 6 Hours</option>
              <option value="24">Last 24 Hours</option>
              <option value="168">Last 7 Days</option>
            </select>
         </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
           <div className="h-10 w-10 rounded-full border-2 border-border border-t-primary animate-spin" />
           <p className="text-xs font-medium text-muted-foreground">Analyzing clusters...</p>
        </div>
      ) : (
        <div className="space-y-10 animate-in fade-in duration-500">
          {activeTab === "overview" && stats && (
            <div className="space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    title="Total Runs" 
                    value={stats.total_runs} 
                    format="number" 
                    icon={<Activity className="h-4 w-4" />}
                    trend="+12.4%"
                    color="blue"
                  />
                  <StatCard 
                    title="Mean Latency" 
                    value={stats.metrics?.latency_ms?.mean || 0} 
                    format="duration" 
                    icon={<Clock className="h-4 w-4" />}
                    trend="-210ms"
                    trendUp={true}
                    color="emerald"
                  />
                  <StatCard 
                    title="Total Cost" 
                    value={stats.metrics?.cost_usd?.mean || 0} 
                    format="currency" 
                    icon={<DollarSign className="h-4 w-4" />}
                    trend="+0.02%"
                    trendUp={false}
                    color="violet"
                  />
                  <StatCard 
                    title="Accuracy" 
                    value={stats.metrics?.hallucination_score?.mean || 0} 
                    format="score" 
                    icon={<Shield className="h-4 w-4" />}
                    trend="-0.04"
                    trendUp={true}
                    color="amber"
                  />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 pro-card">
                     <div className="flex items-center justify-between mb-8">
                        <div>
                           <h3 className="text-sm font-semibold">Latency Distribution</h3>
                           <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-1">Percentile Breakdown</p>
                        </div>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                     </div>
                     
                     <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                          { label: "P25", value: stats.metrics.latency_ms.p25, color: "blue" },
                          { label: "P50", value: stats.metrics.latency_ms.p50, color: "blue" },
                          { label: "P75", value: stats.metrics.latency_ms.p75, color: "blue" },
                          { label: "P90", value: stats.metrics.latency_ms.p90, color: "violet" },
                          { label: "P95", value: stats.metrics.latency_ms.p95, color: "rose" },
                        ].map((p) => (
                          <div key={p.label} className="group p-4 rounded-lg bg-secondary/20 border border-border hover:border-primary/20 transition-all text-center">
                             <div className="text-lg font-bold tracking-tight">
                               {p.value?.toFixed(0)}<span className="text-[10px] ml-0.5 font-medium text-muted-foreground">ms</span>
                             </div>
                             <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                               {p.label}
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="pro-card flex flex-col">
                     <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Variance Data</h3>
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                     </div>
                     
                     <div className="flex-1 space-y-4">
                        <VarianceRow label="Std Deviation" value={stats.metrics.latency_ms.std_dev?.toFixed(2)} unit="ms" />
                        <VarianceRow label="Minimum" value={stats.metrics.latency_ms.min?.toFixed(2)} unit="ms" />
                        <VarianceRow label="Maximum" value={stats.metrics.latency_ms.max?.toFixed(2)} unit="ms" />
                     </div>

                     <div className="mt-8 pt-6 border-t border-border">
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                           <Shield className="h-3 w-3 text-emerald-500" /> Confidence 99.4%
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === "trends" && trend && (
            <div className="space-y-10">
               <div className="pro-card py-10 bg-secondary/20">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
                     <div>
                        <div className={cn(
                           "text-4xl font-bold tracking-tight mb-2",
                           trend.trend === "Up" ? "text-rose-600" : "text-emerald-600"
                        )}>
                           {trend.trend === "Up" ? "↑" : "↓"} {trend.change_percent?.toFixed(1)}%
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Shift Delta</p>
                     </div>
                     <div className="border-x border-border">
                        <div className="text-4xl font-bold tracking-tight mb-2 text-primary">
                           {trend.confidence?.toFixed(2)}
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Confidence</p>
                     </div>
                     <div>
                        <div className="text-4xl font-bold tracking-tight mb-2 text-foreground">
                           {trend.data_points}
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Data Points</p>
                     </div>
                  </div>
               </div>

               <div className="pro-card p-0 overflow-hidden">
                  <div className="bg-secondary/30 px-6 py-4 flex items-center justify-between border-b border-border">
                     <h3 className="text-sm font-semibold">Oscillation Timeline</h3>
                     <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground text-xs font-medium uppercase tracking-widest">
                     Dynamic Timeline Loading...
                  </div>
               </div>
            </div>
          )}

          {activeTab === "comparison" && comparison && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-6">
                  {Object.entries(comparison.models || {}).map(([model, data]: [string, any]) => (
                    <div key={model} className="pro-card group hover:border-primary/20 transition-all">
                       <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                             <div className="h-9 w-9 rounded-lg bg-secondary/50 flex items-center justify-center border border-border group-hover:bg-primary/10 transition-colors">
                                <Layers className="h-4 w-4 text-primary" />
                             </div>
                             <h4 className="text-base font-bold text-foreground">{model}</h4>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="text-right">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Throughput</p>
                                <p className="text-xs font-bold">{data.total_runs} runs</p>
                             </div>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <MetricBox label="Latency" value={data.metrics?.latency_ms?.mean?.toFixed(0)} unit="ms" color="blue" />
                          <MetricBox label="Cost" value={data.metrics?.cost_usd?.mean?.toFixed(4)} unit="$" color="violet" />
                          <MetricBox label="Precision" value={data.metrics?.hallucination_score?.mean?.toFixed(2)} unit="" color="rose" />
                       </div>
                    </div>
                  ))}
               </div>

               <div className="space-y-6">
                  <div className="pro-card">
                     <h3 className="text-sm font-semibold mb-6">Leaderboard</h3>
                     <div className="space-y-6">
                        <RankRow label="Fastest Engine" value={comparison.rankings?.fastest} icon={<Zap className="h-4 w-4 text-blue-600" />} />
                        <RankRow label="Cost Optimized" value={comparison.rankings?.cheapest} icon={<DollarSign className="h-4 w-4 text-emerald-600" />} />
                        <RankRow label="Precision Core" value={comparison.rankings?.most_accurate} icon={<Shield className="h-4 w-4 text-violet-600" />} />
                     </div>
                  </div>
                  
                  <div className="pro-card bg-secondary/10 border-dashed border-border">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">System Insight</p>
                     <p className="text-xs text-foreground leading-relaxed font-medium italic">
                        "The current delta between LLaVA and GPT-4 indicates a 24% efficiency gap in visual tokenization. Recommend scaling Cluster-02."
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

function StatCard({ title, value, format, icon, trend, trendUp, color }: any) {
  const formatValue = (val: number) => {
    switch (format) {
      case "number": return val.toLocaleString();
      case "duration": return `${val.toFixed(0)}ms`;
      case "currency": return `$${val.toFixed(4)}`;
      case "score": return val.toFixed(3);
      default: return val.toString();
    }
  };

  const colorMap = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    violet: "text-violet-600 bg-violet-50 border-violet-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
  };

  return (
    <div className="pro-card group">
      <div className="flex items-center justify-between mb-4">
         <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center border", colorMap[color as keyof typeof colorMap])}>
            {icon}
         </div>
         {trend && (
            <span className={cn(
               "text-[10px] font-bold px-1.5 py-0.5 rounded-md border",
               trendUp ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
            )}>
               {trend}
            </span>
         )}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold tracking-tight text-foreground">{formatValue(value)}</p>
    </div>
  );
}

function VarianceRow({ label, value, unit }: any) {
   return (
      <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
         <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
         <span className="text-xs font-bold text-foreground">{value}{unit}</span>
      </div>
   )
}

function MetricBox({ label, value, unit, color }: any) {
   const colorMap = {
      blue: "text-blue-600",
      emerald: "text-emerald-600",
      violet: "text-violet-600",
      amber: "text-amber-600",
      rose: "text-rose-600"
   };
   return (
      <div className="p-3 rounded-lg bg-secondary/20 border border-border text-center">
         <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
         <p className={cn("text-sm font-bold tracking-tight", colorMap[color as keyof typeof colorMap])}>{value}{unit}</p>
      </div>
   )
}

function RankRow({ label, value, icon }: any) {
   return (
      <div className="flex items-center gap-4">
         <div className="h-8 w-8 rounded-lg bg-secondary/50 flex items-center justify-center border border-border">
            {icon}
         </div>
         <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-xs font-bold text-foreground tracking-tight">{value || "Awaiting Data"}</p>
         </div>
      </div>
   )
}
