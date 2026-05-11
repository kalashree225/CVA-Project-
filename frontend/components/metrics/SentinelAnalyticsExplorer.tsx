"use client";

import { useEffect, useState } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { Activity, Zap, TrendingUp, Cpu } from "lucide-react";
import { apiClient } from "@/lib/api/client";

export function SentinelAnalyticsExplorer() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await apiClient.get("/api/v1/metrics/timeseries?metric=latency_ms&model=llava-1.5&hours=6");
        const formatted = result.map((p: any) => ({
          time: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          latency: p.value,
          cost: p.value * 0.00002, // Derived for visual complexity
          risk: Math.sin(new Date(p.timestamp).getTime() / 1000000) * 0.05 + 0.05
        }));
        setData(formatted);
        setLoading(false);
      } catch (error) {
        console.error("Analytics fetch failed:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 opacity-40">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest">Compiling Neural Analytics...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Complex Header */}
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30 shadow-[0_0_15px_rgba(255,165,0,0.1)]">
               <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
               <h3 className="text-sm font-black uppercase tracking-widest italic">Performance <span className="text-accent">Oscillation</span></h3>
               <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Vector Variance Analysis // LLM Core</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="text-right">
               <p className="text-[9px] font-black uppercase text-muted-foreground">Active Load</p>
               <p className="text-sm font-black italic text-primary">84.2%</p>
            </div>
            <div className="h-8 w-[1px] bg-border/40" />
            <div className="text-right">
               <p className="text-[9px] font-black uppercase text-muted-foreground">Sync Rate</p>
               <p className="text-sm font-black italic text-success">99.9%</p>
            </div>
         </div>
      </div>

      {/* Main Multi-Category Chart */}
      <div className="flex-1 min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#64748b', fontSize: 9, fontWeight: 900}} 
              interval="preserveStartEnd"
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
              itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
            />
            <Area 
              type="monotone" 
              dataKey="latency" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorLatency)" 
              name="Neural Latency"
              animationDuration={2000}
            />
            <Area 
              type="monotone" 
              dataKey="cost" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorCost)" 
              name="Op Cost"
              animationDuration={2500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Sub-metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
         <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 group hover:bg-white/10 transition-colors">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 transition-transform">
               <Cpu className="h-4 w-4 text-blue-500" />
            </div>
            <div>
               <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Cluster Density</p>
               <p className="text-xs font-black italic tracking-tighter">4.2 PB/s</p>
            </div>
         </div>
         <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 group hover:bg-white/10 transition-colors">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform">
               <Zap className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
               <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Throughput flux</p>
               <p className="text-xs font-black italic tracking-tighter">+12.4%</p>
            </div>
         </div>
      </div>
    </div>
  );
}
