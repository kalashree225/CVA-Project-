"use client";

import { useEffect, useState } from "react";
import { 
  Zap, 
  Activity, 
  Clock, 
  DollarSign, 
  Shield, 
  BarChart3, 
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon,
  PieChart as PieChartIcon,
  Filter,
  RefreshCcw,
  Search,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { AreaChart, BarChart, LineChart } from "@/components/charts";

export default function MetricsPage() {
  const [metric, setMetric] = useState("latency_ms");
  const [model, setModel] = useState("llava-1.5");
  const [hours, setHours] = useState(24);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("area");

  useEffect(() => {
    fetchMetrics();
  }, [metric, model, hours]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const result = await apiClient.get("/api/v1/metrics/timeseries", {
        metric,
        model,
        hours,
      });
      
      const chartData = result.map((point: any) => ({
        timestamp: new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: point.value,
      }));
      
      setData(chartData);
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getChartColor = () => {
    const colors: Record<string, string> = {
      latency_ms: "#3b82f6",
      token_count_input: "#10b981",
      token_count_output: "#f59e0b",
      cost_usd: "#ef4444",
      hallucination_score: "#8b5cf6",
    };
    return colors[metric] || "#3b82f6";
  };

  const getMetricLabel = () => {
    const labels: Record<string, string> = {
      latency_ms: "Inference Latency",
      token_count_input: "Input Token Flow",
      token_count_output: "Output Token Flux",
      cost_usd: "Operational Cost",
      hallucination_score: "Hallucination Variance",
    };
    return labels[metric] || metric;
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Dynamic Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Telemetry Engine // Real-time Vector Extraction</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic">
            Telemetry <span className="animate-gradient-text text-accent">Explorer</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
           <Button variant="outline" size="md" className="gap-2 border-white/5 bg-white/5 hover:bg-white/10" onClick={fetchMetrics}>
            <RefreshCcw className="h-4 w-4" /> Resync Stream
          </Button>
          <Button variant="primary" size="md" className="gap-2 bg-accent hover:bg-accent/80 text-black border-none font-black uppercase tracking-widest text-[10px]">
            <Search className="h-4 w-4" /> Neural Query
          </Button>
        </div>
      </header>

      {/* Control Surface */}
      <section className="creative-card p-6 grid grid-cols-1 md:grid-cols-4 gap-6 bg-black/40 border-white/5">
         <ControlBox 
            label="Metric Vector" 
            value={metric} 
            onChange={setMetric}
            options={[
              { value: "latency_ms", label: "Latency (ms)" },
              { value: "token_count_input", label: "Input Flow" },
              { value: "token_count_output", label: "Output Flux" },
              { value: "cost_usd", label: "USD Cost" },
              { value: "hallucination_score", label: "Hallucination" }
            ]}
         />
         <ControlBox 
            label="Model Cluster" 
            value={model} 
            onChange={setModel}
            options={[
              { value: "llava-1.5", label: "LLaVA 1.5" },
              { value: "gpt-4-vision", label: "GPT-4 Vision" },
              { value: "claude-3-opus", label: "Claude 3 Opus" }
            ]}
         />
         <ControlBox 
            label="Temporal Range" 
            value={hours.toString()} 
            onChange={(v: string) => setHours(Number(v))}
            options={[
              { value: "1", label: "1 Hour" },
              { value: "6", label: "6 Hours" },
              { value: "24", label: "24 Hours" },
              { value: "168", label: "7 Days" }
            ]}
         />
         <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Visualization Mode</label>
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 h-[46px]">
               {[
                 { id: "area", icon: AreaChartIcon },
                 { id: "line", icon: LineChartIcon },
                 { id: "bar", icon: BarChart3 }
               ].map((t) => (
                 <button
                    key={t.id}
                    onClick={() => setChartType(t.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center rounded-lg transition-all",
                      chartType === t.id ? "bg-accent text-black" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                 >
                   <t.icon className="h-4 w-4" />
                 </button>
               ))}
            </div>
         </div>
      </section>

      {/* Main Visualization Cluster */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3 creative-card p-0 overflow-hidden min-h-[500px] flex flex-col border-white/5 bg-black/40 shadow-2xl">
            <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-accent" />
                  <div>
                    <h3 className="text-xl font-black tracking-tighter uppercase italic">{getMetricLabel()} <span className="text-accent">Trace</span></h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Neural Cluster: {model}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="text-right">
                     <p className="text-[9px] font-black uppercase text-muted-foreground">Avg Value</p>
                     <p className="text-sm font-black italic text-accent">
                        {data && data.length > 0 ? (data.reduce((acc: any, curr: any) => acc + curr.value, 0) / data.length).toFixed(2) : "0.00"}
                     </p>
                  </div>
               </div>
            </div>
            
            <div className="flex-1 p-8 flex items-center justify-center relative overflow-hidden">
               {/* Background Decorative Grid */}
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
               
               {loading ? (
                 <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-white/5 border-t-accent animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Syncing Vector Stream...</p>
                 </div>
               ) : data && data.length > 0 ? (
                 <div className="w-full h-full">
                    {/* Simplified placeholder for actual chart components to avoid import issues */}
                    {chartType === "area" && <AreaChart data={data} dataKey="value" xAxisKey="timestamp" color={getChartColor()} height={400} />}
                    {chartType === "line" && <LineChart data={data} dataKey="value" xAxisKey="timestamp" color={getChartColor()} height={400} />}
                    {chartType === "bar" && <BarChart data={data} dataKey="value" xAxisKey="timestamp" color={getChartColor()} height={400} />}
                 </div>
               ) : (
                 <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-50 italic">No telemetry vectors found for this cluster</p>
               )}
            </div>
         </div>

         {/* Sidebar Intel */}
         <div className="space-y-8">
            <div className="creative-card border-accent/20 bg-accent/5">
               <h4 className="text-lg font-black uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" /> Live <span className="text-accent">Stats</span>
               </h4>
               <div className="space-y-6">
                  {data && data.length > 0 ? (
                    <>
                      <MetricInsight label="Peak Amplitude" value={Math.max(...data.map((d: any) => d.value)).toFixed(2)} />
                      <MetricInsight label="Floor Level" value={Math.min(...data.map((d: any) => d.value)).toFixed(2)} />
                      <MetricInsight label="Packet Count" value={data.length} />
                      <MetricInsight label="Sync Quality" value="99.9%" />
                    </>
                  ) : (
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">Awaiting telemetry...</p>
                  )}
               </div>
            </div>

            <div className="creative-card bg-black/40 border-white/5">
               <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sentinel Pulse</span>
               </div>
               <p className="text-xs italic leading-relaxed font-medium">
                  The telemetry stream indicates nominal vector distribution. Oscillation patterns are within the expected 5% variance threshold for {model}.
               </p>
            </div>
         </div>
      </section>

      {/* Raw Vector Log */}
      {data && !loading && data.length > 0 && (
        <section className="creative-card p-0 overflow-hidden border-white/5 bg-black/40 shadow-2xl">
          <div className="px-8 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-accent" />
               <h2 className="text-sm font-black uppercase tracking-widest italic">Vector <span className="text-accent">Packet Log</span></h2>
            </div>
            <span className="text-[9px] font-black uppercase text-muted-foreground">Showing last 20 extractions</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Extraction Timestamp</th>
                  <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Vector Identity</th>
                  <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-right">Magnitude</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.slice(0, 20).map((point: any, index: number) => (
                  <tr key={index} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-4 text-[11px] font-black italic tracking-tight text-foreground">{point.timestamp}</td>
                    <td className="px-8 py-4 text-[10px] font-mono text-muted-foreground group-hover:text-accent transition-colors">VEC-{Math.random().toString(36).substring(2, 10).toUpperCase()}</td>
                    <td className="px-8 py-4 text-right text-xs font-black italic text-accent">{point.value?.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function ControlBox({ label, value, onChange, options }: any) {
   return (
      <div className="space-y-2">
         <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{label}</label>
         <div className="relative group">
            <select
               value={value}
               onChange={(e) => onChange(e.target.value)}
               className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-black italic outline-none focus:border-accent/50 appearance-none transition-all cursor-pointer"
            >
               {options.map((o: any) => (
                  <option key={o.value} value={o.value} className="bg-card">{o.label}</option>
               ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors pointer-events-none" />
         </div>
      </div>
   )
}

function MetricInsight({ label, value }: any) {
   return (
      <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
         <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
         <span className="text-base font-black italic text-accent tracking-tighter">{value}</span>
      </div>
   )
}
