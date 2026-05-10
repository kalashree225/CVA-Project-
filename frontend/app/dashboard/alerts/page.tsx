<<<<<<< HEAD
"use client";

import { useEffect, useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, Zap, AlertTriangle, Plus, Filter, Download, ChevronRight, Lock, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { AlertEvent, AlertRule } from "@/types";
import { toast } from "sonner";
=======
import { Shield, ShieldAlert, ShieldCheck, Zap, AlertTriangle, Plus, Filter, Download, ChevronRight, Lock, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
>>>>>>> 1f9e1f428c60a05a90a56f90b558cb17b6e52531

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    metric: "latency_ms",
    operator: "gt",
    threshold: 5000,
    webhook_url: "",
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const [rulesData, eventsData] = await Promise.all([
        apiClient.get("/api/v1/alerts/rules"),
        apiClient.get("/api/v1/alerts/events?limit=10"),
      ]);
      setRules(rulesData);
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/api/v1/alerts/rules", newRule);
      toast.success("Security protocol established");
      setShowCreateForm(false);
      setNewRule({
        name: "",
        metric: "latency_ms",
        operator: "gt",
        threshold: 5000,
        webhook_url: "",
      });
      fetchAlerts();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to create security rule");
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await apiClient.delete(`/api/v1/alerts/rules/${ruleId}`);
      toast.success("Security protocol revoked");
      fetchAlerts();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to delete security rule");
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Dynamic Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Threat Intelligence // Shield Active</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic">
            Security <span className="animate-gradient-text text-rose-500">Sentinel</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" className="gap-2 border-white/5 bg-white/5 hover:bg-white/10">
            <Filter className="h-4 w-4" /> Filter Threats
          </Button>
          <Button 
            variant="primary" 
            size="md" 
            className="gap-2 bg-rose-600 hover:bg-rose-700 text-white border-none"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? "Cancel Protocol" : <><Plus className="h-4 w-4" /> Deploy Mitigation</>}
          </Button>
        </div>
      </header>

      {/* Security Status Overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="creative-card flex items-center gap-6 bg-rose-500/5 border-rose-500/20">
            <div className="h-16 w-16 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
               <ShieldAlert className="h-8 w-8 text-rose-500" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Critical Threats</p>
               <p className="text-3xl font-black italic tracking-tighter text-rose-500">0</p>
            </div>
         </div>
         <div className="creative-card flex items-center gap-6 bg-emerald-500/5 border-emerald-500/20">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
               <ShieldCheck className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Protocols Active</p>
               <p className="text-3xl font-black italic tracking-tighter text-emerald-500">{rules.length}</p>
            </div>
         </div>
         <div className="creative-card flex items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
               <Lock className="h-8 w-8 text-primary" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Automated Actions</p>
               <p className="text-3xl font-black italic tracking-tighter">142</p>
            </div>
         </div>
      </section>

      {/* Create Security Protocol Form */}
      {showCreateForm && (
        <section className="creative-card animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-8">
            <Plus className="h-5 w-5 text-rose-500" />
            <h2 className="text-xl font-black uppercase tracking-tighter italic">Establish <span className="text-rose-500">Mitigation Protocol</span></h2>
          </div>
          <form onSubmit={handleCreateRule} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Protocol Name</label>
              <input
                type="text"
                required
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-rose-500/50 outline-none transition-colors italic font-bold"
                placeholder="Ex: Latency Spike Mitigation"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Metric</label>
              <select
                value={newRule.metric}
                onChange={(e) => setNewRule({ ...newRule, metric: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-rose-500/50 outline-none transition-colors font-bold appearance-none"
              >
                <option value="latency_ms" className="bg-card">Inference Latency (ms)</option>
                <option value="token_count_output" className="bg-card">Output Token Volume</option>
                <option value="hallucination_score" className="bg-card">Hallucination Index</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Threshold Value</label>
              <input
                type="number"
                required
                value={newRule.threshold}
                onChange={(e) => setNewRule({ ...newRule, threshold: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-rose-500/50 outline-none transition-colors font-mono font-bold"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Automated Webhook (SIEM/Slack)</label>
              <input
                type="url"
                value={newRule.webhook_url || ""}
                onChange={(e) => setNewRule({ ...newRule, webhook_url: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-rose-500/50 outline-none transition-colors font-mono"
                placeholder="https://hooks.sentinel.ai/..."
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full h-[46px] bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
              >
                Deploy Security Protocol
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Active Protocols */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tighter uppercase italic">Active <span className="text-primary">Protocols</span></h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{rules.length} Synchronized</span>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 w-full bg-white/5 animate-pulse rounded-2xl" />
              ))
            ) : rules.length === 0 ? (
              <div className="creative-card py-12 flex flex-col items-center justify-center text-muted-foreground">
                 <Shield className="h-10 w-10 mb-4 opacity-20" />
                 <p className="text-xs font-black uppercase tracking-widest">No mitigation protocols active</p>
              </div>
            ) : (
              rules.map((rule) => (
                <div key={rule.id} className="creative-card flex items-center justify-between group hover:border-rose-500/30">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-rose-500/10 group-hover:border-rose-500/20 transition-colors">
                        <Zap className="h-5 w-5 text-muted-foreground group-hover:text-rose-500" />
                     </div>
                     <div>
                        <h3 className="text-sm font-black italic tracking-tight">{rule.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1.5 py-0.5 bg-white/5 rounded">{rule.metric}</span>
                           <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">{rule.operator} {rule.threshold}</span>
                        </div>
                     </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 text-muted-foreground hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Download className="h-4 w-4 rotate-45" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Threat Audit Log */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tighter uppercase italic">Threat <span className="text-rose-500">Audit Log</span></h2>
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
               View Full History <ChevronRight className="h-3 w-3 ml-2" />
            </Button>
          </div>

          <div className="creative-card p-0 overflow-hidden bg-black/40 border-white/5">
             <div className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 w-full animate-pulse px-6 py-4" />
                  ))
                ) : events.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
                     <p className="text-xs font-black uppercase tracking-widest">Awaiting threat packets...</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="px-6 py-4 flex items-center justify-between hover:bg-rose-500/5 transition-colors group">
                       <div className="flex items-center gap-4">
                          <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                             <AlertTriangle className="h-4 w-4 text-rose-500" />
                          </div>
                          <div>
                             <p className="text-xs font-black uppercase tracking-widest text-foreground">Mitigation Triggered: {event.rule_id.slice(0, 8)}</p>
                             <div className="flex items-center gap-2 mt-0.5">
<<<<<<< HEAD
                                <span className="text-[9px] font-mono text-muted-foreground italic">Value: {event.value.toFixed(2)}</span>
=======
                                <span className="text-[9px] font-mono text-muted-foreground italic">Value: {event.metric_value.toFixed(2)}</span>
>>>>>>> 1f9e1f428c60a05a90a56f90b558cb17b6e52531
                                <span className="h-1 w-1 rounded-full bg-white/20" />
                                <span className="text-[9px] font-black uppercase text-success tracking-widest">Auto-Resolved</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-muted-foreground uppercase">{new Date(event.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <button className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                       </div>
                    </div>
                  ))
                )}
             </div>
             <div className="px-6 py-3 bg-white/5 border-t border-white/5 flex justify-between items-center">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Active Monitoring Cluster: Sentinel-01</p>
                <div className="flex items-center gap-1.5">
                   <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                   <span className="text-[9px] font-black text-success uppercase tracking-widest">Nominal</span>
                </div>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
}
