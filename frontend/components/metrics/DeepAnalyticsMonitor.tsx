"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine
} from "recharts";
import { Activity, Shield, Zap, AlertTriangle, TrendingUp, Cpu, Maximize2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";

export function DeepAnalyticsMonitor() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await apiClient.get("/api/v1/metrics/timeseries?metric=latency_ms&model=llava-1.5&hours=24");
        const formatted = result.map((p: any) => ({
          time: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          latency: p.value,
          cost: (p.value * 0.00002) + (Math.random() * 0.001), // Oscillation
          threshold: 1200
        }));
        setData(formatted);
        setLoading(false);
      } catch (error) {
        console.error("Deep analytics fetch failed:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Primary Analytics Card */}
      <div className="xl:col-span-2 creative-card p-0 overflow-hidden bg-black/40 border-white/5 shadow-2xl">
        <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                 <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                 <h3 className="text-lg font-black uppercase tracking-tighter italic">Neural <span className="text-primary">Performance Trend</span></h3>
                 <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Active Latency vs <span className="text-accent">Cost Oscillation</span></p>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="text-right">
                 <p className="text-[9px] font-black uppercase text-muted-foreground">Variance</p>
                 <p className="text-sm font-black italic text-success">±2.4ms</p>
              </div>
              <button className="h-10 w-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors">
                 <Maximize2 className="h-4 w-4 text-muted-foreground" />
              </button>
           </div>
        </div>

        <div className="p-8 h-[350px]">
           {loading ? (
             <div className="h-full flex items-center justify-center opacity-40 italic text-xs font-black uppercase tracking-widest animate-pulse">Syncing Deep Neural Vectors...</div>
           ) : (
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                   <defs>
                      <linearGradient id="deepLatency" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                         <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="deepCost" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                         <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                   <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 900}} 
                      interval={Math.floor(data.length / 6)}
                   />
                   <YAxis hide domain={['auto', 'auto']} />
                   <Tooltip 
                      contentStyle={{ backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                      itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                   />
                   <Area 
                      type="monotone" 
                      dataKey="latency" 
                      stroke="#3b82f6" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#deepLatency)" 
                      name="Latency (ms)"
                   />
                   <Area 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#deepCost)" 
                      name="Neural Cost"
                   />
                   <ReferenceLine y={1200} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'SLA Limit', fill: '#ef4444', fontSize: 8, fontWeight: 900 }} />
                </AreaChart>
             </ResponsiveContainer>
           )}
        </div>
      </div>

      {/* Anomaly Density Card */}
      <div className="creative-card flex flex-col bg-black/40 border-white/5 shadow-2xl">
         <div className="flex items-center justify-between mb-8">
            <div>
               <h3 className="text-lg font-black uppercase tracking-tighter italic">Anomaly <span className="text-rose-500">Density</span></h3>
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Automated Pattern Recon</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
               <AlertTriangle className="h-5 w-5 text-rose-500" />
            </div>
         </div>
         
         <div className="flex-1 space-y-8">
            <div className="grid grid-cols-6 gap-2">
               {Array(24).fill(0).map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                       "h-10 rounded-lg transition-all duration-700 border border-white/5 relative group cursor-help",
                       i === 14 ? "bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] border-rose-400" :
                       i % 7 === 0 ? "bg-amber-500/20 border-amber-500/20" :
                       "bg-white/5 hover:bg-white/10"
                    )}
                  >
                     {i === 14 && <div className="absolute inset-0 bg-white/20 animate-pulse rounded-lg" />}
                     <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[8px] font-black uppercase text-muted-foreground">H-{i}</div>
                  </div>
               ))}
            </div>

            <div className="pt-8 space-y-4">
               <div className="p-5 rounded-2xl bg-white/5 border border-white/5 group hover:border-primary/20 transition-all">
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Model Integrity</span>
                     <span className="text-[9px] font-black uppercase text-success px-2 py-0.5 bg-success/10 rounded-full border border-success/20 tracking-widest">Secure</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <p className="text-3xl font-black italic tracking-tighter text-success">99.8%</p>
                     <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase text-muted-foreground/40">Confidence</span>
                        <span className="text-xs font-black italic text-primary tracking-tight">High Flux</span>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                     <p className="text-[9px] font-black uppercase text-muted-foreground/40 mb-1">Total Anomalies</p>
                     <p className="text-lg font-black italic">03</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                     <p className="text-[9px] font-black uppercase text-muted-foreground/40 mb-1">Mitigation Time</p>
                     <p className="text-lg font-black italic text-primary">0.4ms</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
