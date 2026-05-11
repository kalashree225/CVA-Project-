"use client";

import { useEffect, useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, Zap, AlertTriangle, Plus, Filter, Download, ChevronRight, Lock, Eye, Trash2, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { AlertEvent, AlertRule } from "@/types";
import { toast } from "sonner";

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
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Security Sentinel</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure automated threat mitigation and monitor security incidents.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
          <Button 
            size="sm" 
            className={cn(
              "h-9 gap-2 border-0",
              showCreateForm ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-primary hover:bg-primary/90 text-white"
            )}
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? "Cancel" : <><Plus className="h-4 w-4" /> New Protocol</>}
          </Button>
        </div>
      </header>

      {/* Overview Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="pro-card flex items-center gap-4 border-rose-100 bg-rose-50/30">
            <div className="h-12 w-12 rounded-lg bg-rose-100 flex items-center justify-center border border-rose-200">
               <ShieldAlert className="h-6 w-6 text-rose-600" />
            </div>
            <div>
               <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 mb-0.5">Critical Threats</p>
               <p className="text-2xl font-bold tracking-tight text-rose-700">0</p>
            </div>
         </div>
         <div className="pro-card flex items-center gap-4 border-emerald-100 bg-emerald-50/30">
            <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center border border-emerald-200">
               <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
               <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-0.5">Active Rules</p>
               <p className="text-2xl font-bold tracking-tight text-emerald-700">{rules.length}</p>
            </div>
         </div>
         <div className="pro-card flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-secondary/50 flex items-center justify-center border border-border">
               <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
               <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Alerts Triggered</p>
               <p className="text-2xl font-bold tracking-tight text-foreground">{events.length}</p>
            </div>
         </div>
      </section>

      {/* Create Form */}
      {showCreateForm && (
        <section className="pro-card p-6 animate-in fade-in slide-in-from-top-2 duration-300 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-sm font-semibold">New Security Protocol</h2>
          </div>
          <form onSubmit={handleCreateRule} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Protocol Name</label>
              <input
                type="text"
                required
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-primary/20 outline-none transition-all font-medium"
                placeholder="Ex: Latency Spike Monitor"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Target Metric</label>
              <select
                value={newRule.metric}
                onChange={(e) => setNewRule({ ...newRule, metric: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-primary/20 outline-none transition-all font-medium"
              >
                <option value="latency_ms">Inference Latency (ms)</option>
                <option value="token_count_output">Output Token Volume</option>
                <option value="hallucination_score">Hallucination Index</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Threshold</label>
              <input
                type="number"
                required
                value={newRule.threshold}
                onChange={(e) => setNewRule({ ...newRule, threshold: Number(e.target.value) })}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-primary/20 outline-none transition-all font-medium"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Webhook URL (Optional)</label>
              <input
                type="url"
                value={newRule.webhook_url || ""}
                onChange={(e) => setNewRule({ ...newRule, webhook_url: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-primary/20 outline-none transition-all font-medium"
                placeholder="https://hooks.slack.com/..."
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full bg-primary text-white border-0">
                Deploy Protocol
              </Button>
            </div>
          </form>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Rules List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold tracking-tight">Active Protocols</h2>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{rules.length} configured</span>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 w-full bg-secondary/20 animate-pulse rounded-lg border border-border" />
              ))
            ) : rules.length === 0 ? (
              <div className="pro-card py-12 flex flex-col items-center justify-center text-muted-foreground border-dashed">
                 <Shield className="h-8 w-8 mb-3 opacity-20" />
                 <p className="text-xs font-medium">No protocols configured</p>
              </div>
            ) : (
              rules.map((rule) => (
                <div key={rule.id} className="pro-card flex items-center justify-between group hover:border-primary/20 transition-all py-4">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center border border-border group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors text-muted-foreground group-hover:text-primary">
                        <Zap className="h-5 w-5" />
                     </div>
                     <div>
                        <h3 className="text-sm font-semibold">{rule.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                           <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider">{rule.metric}</span>
                           <span className="text-[9px] font-bold uppercase text-primary tracking-wider">{rule.operator} {rule.threshold}</span>
                        </div>
                     </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 text-muted-foreground hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Audit Log */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold tracking-tight text-rose-600">Threat Audit Log</h2>
            <Button variant="ghost" size="sm" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
               Full History <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div className="pro-card p-0 overflow-hidden border-rose-100">
             <div className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-14 w-full animate-pulse px-6 py-4" />
                  ))
                ) : events.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
                     <p className="text-xs font-medium">Awaiting security events...</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-rose-50/30 transition-colors group">
                       <div className="flex items-center gap-4">
                          <div className="h-8 w-8 rounded-lg bg-rose-100/50 flex items-center justify-center border border-rose-200">
                             <AlertTriangle className="h-4 w-4 text-rose-600" />
                          </div>
                          <div>
                             <p className="text-[11px] font-semibold text-foreground">Mitigation: {event.rule_id.slice(0, 8)}</p>
                             <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-muted-foreground font-medium">Value: {event.value.toFixed(2)}</span>
                                <span className="h-0.5 w-0.5 rounded-full bg-border" />
                                <span className="text-[9px] font-bold uppercase text-emerald-600 tracking-wider">Resolved</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-[10px] font-semibold text-muted-foreground">{new Date(event.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <button className="h-7 w-7 rounded-md bg-secondary/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                       </div>
                    </div>
                  ))
                )}
             </div>
             <div className="px-5 py-3 bg-secondary/20 border-t border-border flex justify-between items-center">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Cluster: Sentinel-01</p>
                <div className="flex items-center gap-1.5">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Active</span>
                </div>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
}
