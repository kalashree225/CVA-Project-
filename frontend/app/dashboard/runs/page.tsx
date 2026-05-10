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
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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
    <div className="space-y-12 pb-20">
      {/* Dynamic Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Log Inspector // Packet Stream Active</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic">
            Packet <span className="animate-gradient-text">Intelligence</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                 type="text"
                 placeholder="Search run ID..."
                 className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-primary/50 outline-none transition-all w-64 italic font-bold"
              />
           </div>
          <Button variant="outline" size="md" className="gap-2 border-white/5 bg-white/5 hover:bg-white/10">
            <Filter className="h-4 w-4" /> Advanced Filter
          </Button>
        </div>
      </header>

      {/* Filter Toolbar */}
      <section className="creative-card p-4 grid grid-cols-1 md:grid-cols-3 gap-6 bg-black/40 border-white/5">
         <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Model Selection</label>
            <select
              value={filters.model}
              onChange={(e) => setFilters({ ...filters, model: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-black italic outline-none focus:border-primary/50 appearance-none"
            >
              <option value="" className="bg-card">All Neural Models</option>
              <option value="gpt-4" className="bg-card">GPT-4 Sentinel</option>
              <option value="claude-3" className="bg-card">Claude 3 Vision</option>
            </select>
         </div>
         <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Traffic Type</label>
            <select
              value={filters.input_type}
              onChange={(e) => setFilters({ ...filters, input_type: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-black italic outline-none focus:border-primary/50 appearance-none"
            >
              <option value="" className="bg-card">All Modalities</option>
              <option value="text" className="bg-card">Neural Text</option>
              <option value="image" className="bg-card">Visual Packets</option>
            </select>
         </div>
         <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Execution Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-black italic outline-none focus:border-primary/50 appearance-none"
            >
              <option value="" className="bg-card">All Statuses</option>
              <option value="completed" className="bg-card">Nominal (Success)</option>
              <option value="failed" className="bg-card">Failed (Anomaly)</option>
            </select>
         </div>
      </section>

      {/* Runs Table Wrapper */}
      <section className="creative-card p-0 overflow-hidden border-white/5 bg-black/40 shadow-2xl">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-white/5">
           <Terminal className="h-4 w-4 text-primary" />
           <span className="text-[10px] font-black uppercase tracking-widest italic">Live Packet Console // Showing {runs.length} Runs</span>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="h-12 w-12 rounded-full border-4 border-white/5 border-t-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Syncing with Sentinel Cluster...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Neural Run ID</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Model & Modality</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Performance</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Cost/Tokens</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Inspector</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {runs.map((run) => (
                  <tr key={run.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="text-xs font-mono font-bold text-foreground">SHM-{run.id.slice(0, 8)}</span>
                          <span className="text-[9px] font-black uppercase text-muted-foreground mt-1 flex items-center gap-1.5">
                             <Clock className="h-2.5 w-2.5" /> {new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="text-sm font-black italic tracking-tight">{run.model_name}</span>
                          <div className="flex items-center gap-2 mt-1">
                             <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded font-black uppercase border tracking-widest",
                                run.input_type === "image" ? "bg-accent/10 border-accent/20 text-accent" : "bg-primary/10 border-primary/20 text-primary"
                             )}>
                                {run.input_type}
                             </span>
                             {run.hallucination_score !== null && run.hallucination_score > 0.5 && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-rose-500/10 border border-rose-500/20 text-rose-500 tracking-widest">
                                   Potential Anomaly
                                </span>
                             )}
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className={cn(
                         "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                         run.status === "completed" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : 
                         run.status === "failed" ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                         "bg-amber-500/10 border-amber-500/20 text-amber-500"
                       )}>
                          {run.status === "completed" ? <CheckCircle2 className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                          {run.status}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex flex-col items-end">
                          <span className="text-sm font-black italic text-primary tracking-tighter">{formatDuration(run.latency_ms)}</span>
                          <span className="text-[9px] font-black uppercase text-muted-foreground mt-1">Oscillation Trace</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-foreground">{run.token_count_input + run.token_count_output} TOK</span>
                          <span className="text-[9px] font-black uppercase text-accent mt-1">${run.cost_usd.toFixed(4)} USD</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-primary hover:text-primary-foreground group-hover:scale-110">
                          <Eye className="h-4 w-4" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Console Footer / Pagination */}
        <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="h-9 px-4 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                 <ChevronLeft className="h-3 w-3" /> Sync Prev
              </button>
              <div className="h-8 w-[1px] bg-white/10" />
              <button 
                onClick={() => setPage(page + 1)}
                disabled={runs.length === 0}
                className="h-9 px-4 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                 Sync Next <ChevronRight className="h-3 w-3" />
              </button>
           </div>
           
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cluster Node: Sentinel-Alpha-01</span>
              <span className="text-[9px] font-black uppercase text-primary italic">Page {page} // Real-time Feed active</span>
           </div>
        </div>
      </section>
    </div>
  );
}
