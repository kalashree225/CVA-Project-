"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  Filter, 
  Terminal, 
  Shield, 
  Activity, 
  Zap, 
  ChevronRight, 
  Box, 
  Lock,
  Cpu,
  X,
  Eye,
  Layers,
  Database,
  Loader2
} from "lucide-react";
import { cn, formatNumber, formatDuration } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";

export function PacketInspector() {
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const result = await apiClient.get("/api/v1/inference/runs?page_size=20");
        setRuns(result);
        setLoading(false);
      } catch (error) {
        console.error("Packet inspection failed:", error);
      }
    };

    fetchRuns();
    const interval = setInterval(fetchRuns, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative">
      <div className="flex items-center justify-between mb-4">
         <h2 className="text-xl font-black tracking-tighter uppercase italic flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Packet <span className="text-primary">Inspector</span>
         </h2>
         <div className="flex items-center gap-2">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
               <input 
                 type="text" 
                 placeholder="Search Vector ID..." 
                 className="bg-black/20 border border-white/5 rounded-lg py-1.5 pl-8 pr-4 text-[10px] font-black uppercase tracking-widest focus:ring-1 ring-primary/40 outline-none w-48"
               />
            </div>
            <button className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
               <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
         </div>
      </div>

      <div className="creative-card p-0 overflow-hidden bg-black/40 border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Vector Identifier</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Model</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Latency</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Payload</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Risk</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && runs.length === 0 ? (
                <tr>
                   <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-40">
                         <Loader2 className="h-8 w-8 animate-spin text-primary" />
                         <p className="text-[10px] font-black uppercase tracking-widest">Scanning Packet Buffer...</p>
                      </div>
                   </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center font-mono text-[10px] text-primary">
                             {run.id.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">{run.id}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-black uppercase italic tracking-widest">{run.model_name}</td>
                    <td className="px-6 py-4">
                       <span className={cn(
                         "text-[10px] font-black italic",
                         run.latency_ms > 1500 ? "text-rose-500" : "text-emerald-500"
                       )}>{run.latency_ms}ms</span>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-[10px] font-medium text-muted-foreground truncate max-w-[200px]">{run.output_text}</p>
                    </td>
                    <td className="px-6 py-4">
                       <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              run.hallucination_score > 0.05 ? "bg-rose-500" : "bg-emerald-500"
                            )} 
                            style={{ width: `${(run.hallucination_score * 1000).toFixed(0)}%` }} 
                          />
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                         onClick={() => { setSelectedRun(run); setIsOpen(true); }}
                         className="p-2 rounded-lg bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground"
                       >
                          <Eye className="h-3.5 w-3.5" />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hex-Scan Detail Overlay */}
      {isOpen && selectedRun && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsOpen(false)} />
           <div className="relative w-full max-w-4xl creative-card p-0 bg-[#050505] border-primary/20 shadow-[0_0_50px_rgba(16,185,129,0.1)] animate-in zoom-in-95 duration-300">
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-primary/5">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/40">
                       <Database className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black italic uppercase tracking-tighter">Packet <span className="text-primary">Deep Scan</span></h3>
                       <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em]">Vector Hash: {selectedRun.id}</p>
                    </div>
                 </div>
                 <button onClick={() => setIsOpen(false)} className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                    <X className="h-5 w-5" />
                 </button>
              </div>

              <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-8">
                    <section>
                       <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-4">Neural Metadata</h4>
                       <div className="grid grid-cols-2 gap-4">
                          <DetailItem label="Model" value={selectedRun.model_name} />
                          <DetailItem label="Input Type" value={selectedRun.input_type} />
                          <DetailItem label="Status" value={selectedRun.status} color="text-success" />
                          <DetailItem label="Created" value={new Date(selectedRun.created_at).toLocaleString()} />
                       </div>
                    </section>

                    <section>
                       <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-4">Telemetry Metrics</h4>
                       <div className="grid grid-cols-2 gap-4">
                          <DetailItem label="Latency" value={`${selectedRun.latency_ms}ms`} />
                          <DetailItem label="Token Flow" value={`${selectedRun.token_count_input + selectedRun.token_count_output} T`} />
                          <DetailItem label="Total Cost" value={`$${selectedRun.cost_usd.toFixed(6)}`} />
                          <DetailItem label="Anomaly Score" value={selectedRun.hallucination_score?.toFixed(4) || "N/A"} />
                       </div>
                    </section>
                 </div>

                 <div className="space-y-8">
                    <section className="h-full flex flex-col">
                       <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-4">Payload Extract</h4>
                       <div className="flex-1 p-6 rounded-2xl bg-white/5 border border-white/5 font-mono text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap overflow-y-auto max-h-[300px]">
                          {selectedRun.output_text}
                       </div>
                    </section>
                 </div>
              </div>

              <div className="px-8 py-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Integrity Verified via Neural Key</span>
                 </div>
                 <button className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all">
                    Export Audit Log
                 </button>
              </div>
           </div>
        </div>
      )}
    </section>
  );
}

function DetailItem({ label, value, color = "text-foreground" }: any) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
       <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">{label}</p>
       <p className={cn("text-xs font-black italic uppercase", color)}>{value}</p>
    </div>
  )
}
