"use client";

import { useEffect, useState } from "react";
import { 
  Activity, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Terminal, 
  Cpu, 
  Zap,
  CheckCircle2,
  ShieldAlert,
  Clock,
  DollarSign,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, formatDuration } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { InferenceRun } from "@/types";

export default function RunsPage() {
  const [runs, setRuns] = useState<InferenceRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    model: "",
    input_type: "",
    status: "",
  });

  useEffect(() => {
    fetchRuns();
  }, [page, filters]);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const params: any = { page, page_size: 20 };
      if (filters.model) params.model = filters.model;
      if (filters.input_type) params.input_type = filters.input_type;
      if (filters.status) params.status = filters.status;

      const data = await apiClient.get("/api/v1/inference/runs", params);
      setRuns(data);
    } catch (error) {
      console.error("Error fetching runs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Packet Intelligence</h1>
          <p className="text-muted-foreground text-sm mt-1">Inspect live packet streams and monitor neural execution logs.</p>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                 type="text"
                 placeholder="Search run ID..."
                 className="bg-secondary/30 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary/20 outline-none transition-all w-64 font-medium"
              />
           </div>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
      </header>

      {/* Filter Toolbar */}
      <section className="pro-card p-4 grid grid-cols-1 md:grid-cols-3 gap-6 bg-secondary/10">
         <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Neural Model</label>
            <select
              value={filters.model}
              onChange={(e) => setFilters({ ...filters, model: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/20 appearance-none"
            >
              <option value="">All Models</option>
              <option value="gpt-4">GPT-4 Sentinel</option>
              <option value="claude-3">Claude 3 Vision</option>
            </select>
         </div>
         <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Modality</label>
            <select
              value={filters.input_type}
              onChange={(e) => setFilters({ ...filters, input_type: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/20 appearance-none"
            >
              <option value="">All Modalities</option>
              <option value="text">Textual</option>
              <option value="image">Visual</option>
            </select>
         </div>
         <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Execution Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/20 appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
         </div>
      </section>

      {/* Table Section */}
      <section className="pro-card p-0 overflow-hidden border-border bg-background">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
            <p className="text-xs font-medium text-muted-foreground">Syncing packet stream...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/20 border-b border-border">
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Run ID</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Model & Type</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Performance</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Cost/Tokens</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runs.map((run) => (
                  <tr key={run.id} className="group hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="text-[11px] font-mono font-bold text-foreground">SHM-{run.id.slice(0, 8)}</span>
                          <span className="text-[10px] font-medium text-muted-foreground mt-0.5 flex items-center gap-1.5">
                             <Clock className="h-2.5 w-2.5" /> {new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="text-xs font-bold tracking-tight text-foreground">{run.model_name}</span>
                          <div className="flex items-center gap-2 mt-1">
                             <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border tracking-wider",
                                run.input_type === "image" ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-secondary border-border text-muted-foreground"
                             )}>
                                {run.input_type}
                             </span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className={cn(
                         "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                         run.status === "completed" ? "bg-emerald-50 border-emerald-100 text-emerald-600" : 
                         run.status === "failed" ? "bg-rose-50 border-rose-100 text-rose-600" :
                         "bg-amber-50 border-amber-100 text-amber-600"
                       )}>
                          {run.status === "completed" ? <CheckCircle2 className="h-2.5 w-2.5" /> : <ShieldAlert className="h-2.5 w-2.5" />}
                          {run.status}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-blue-600 tracking-tight">{formatDuration(run.latency_ms ?? 0)}</span>
                          <span className="text-[9px] font-bold uppercase text-muted-foreground mt-0.5">Latency</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-foreground">{(run.token_count_input ?? 0) + (run.token_count_output ?? 0)}</span>
                          <span className="text-[9px] font-bold uppercase text-emerald-600 mt-0.5">${(run.cost_usd ?? 0).toFixed(4)}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button className="h-8 w-8 rounded-lg bg-secondary/50 border border-border flex items-center justify-center transition-all hover:bg-primary/10 hover:text-primary opacity-0 group-hover:opacity-100">
                          <Eye className="h-3.5 w-3.5" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-6 py-3 bg-secondary/10 border-t border-border flex items-center justify-between">
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="h-8 px-3 rounded-md bg-background border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-sm"
              >
                 <ChevronLeft className="h-3 w-3" /> Prev
              </button>
              <button 
                onClick={() => setPage(page + 1)}
                disabled={runs.length === 0}
                className="h-8 px-3 rounded-md bg-background border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-sm"
              >
                 Next <ChevronRight className="h-3 w-3" />
              </button>
           </div>
           
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sentinel-Alpha-01</span>
              <span className="text-[9px] font-bold text-primary uppercase">Page {page}</span>
           </div>
        </div>
      </section>
    </div>
  );
}
