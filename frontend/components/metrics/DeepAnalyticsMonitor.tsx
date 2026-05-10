"use client";

import { cn } from "@/lib/utils";
import { useMetricsStore } from "@/lib/store/metricsStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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

export function DeepAnalyticsMonitor() {
  const { events } = useMetricsStore();

  // Process events for the chart
  const chartData = events.length > 5 
    ? events.slice().reverse().map(e => ({
        time: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        latency: e.latency_ms,
        cost: e.cost_usd * 1000,
        forecast: null,
      }))
    : [
        { time: "00:00", latency: 120, cost: 0.12, forecast: 125 },
        { time: "04:00", latency: 145, cost: 0.15, forecast: 140 },
        { time: "08:00", latency: 210, cost: 0.22, forecast: 200 },
        { time: "12:00", latency: 180, cost: 0.19, forecast: 185 },
        { time: "16:00", latency: 165, cost: 0.17, forecast: 170 },
        { time: "20:00", latency: 140, cost: 0.14, forecast: 135 },
        { time: "23:59", latency: 130, cost: 0.13, forecast: 128 },
      ];

  // Mock future forecast data
  const forecastData = [
    ...chartData,
    { time: "01:00*", latency: null, cost: null, forecast: 132 },
    { time: "02:00*", latency: null, cost: null, forecast: 138 },
    { time: "03:00*", latency: null, cost: null, forecast: 145 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 creative-card bg-black/40">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter italic">
              Neural <span className="text-primary">Performance Trend</span>
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">
              Active Latency vs <span className="text-accent">Cost Oscillation</span>
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
               <div className="h-2 w-0.5 bg-primary" />
               <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Real-time</span>
            </div>
            <div className="flex items-center gap-1.5">
               <div className="h-2 w-0.5 bg-white/20 border-t border-dashed border-white" />
               <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Forecast</span>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 900}}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 900}}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(10, 10, 11, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
              />
              <Area 
                type="monotone" 
                dataKey="latency" 
                stroke="var(--primary)" 
                fillOpacity={1} 
                fill="url(#colorLatency)" 
                strokeWidth={4}
                activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--primary)' }}
              />
              <Area 
                type="monotone" 
                dataKey="forecast" 
                stroke="rgba(255,255,255,0.2)" 
                strokeDasharray="5 5"
                fill="transparent"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="cost" 
                stroke="var(--accent)" 
                fillOpacity={1} 
                fill="url(#colorCost)" 
                strokeWidth={4}
                activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--accent)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="creative-card flex flex-col bg-black/40">
        <h3 className="text-lg font-black uppercase tracking-tighter italic mb-2">
          Anomaly <span className="text-rose-500">Density</span>
        </h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-6">Automated Pattern Recognition</p>
        
        <div className="flex-1 flex flex-col justify-between">
           <div className="grid grid-cols-6 gap-2">
             {Array(24).fill(0).map((_, i) => (
               <div 
                 key={i} 
                 className={cn(
                   "h-8 rounded-md transition-all duration-500 border border-white/5",
                   i === 14 ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)] border-rose-400" :
                   i % 7 === 0 ? "bg-amber-500/30 border-amber-500/20" :
                   "bg-white/5"
                 )}
                 title={`Hour ${i}: ${i === 14 ? 'Anomaly Detected' : 'Stable'}`}
               />
             ))}
           </div>
           
           <div className="space-y-4 mt-8">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Predictive Stability</span>
                   <span className="text-sm font-black text-primary italic">High Confidence</span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-2xl font-black italic tracking-tighter text-success">99.82%</span>
                   <div className="h-10 w-10 rounded-full border-4 border-white/5 border-t-success animate-spin-slow" />
                </div>
              </div>
              
              <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                 Run Automated Audit
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
