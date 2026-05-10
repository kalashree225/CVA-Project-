"use client";

import { AutomationHub } from "@/components/metrics/AutomationHub";
import { Button } from "@/components/ui/Button";
import { Play, Plus, Filter, Download } from "lucide-react";

export default function WorkflowsPage() {
  return (
    <div className="space-y-12 pb-20">
      {/* Dynamic Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Orchestration Engine // Active</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic">
            Sentinel <span className="animate-gradient-text">Automation</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" className="gap-2 border-white/5 bg-white/5 hover:bg-white/10">
            <Filter className="h-4 w-4" /> Filter Modules
          </Button>
          <Button variant="primary" size="md" className="gap-2 bg-accent hover:bg-accent/90 text-white border-none">
            <Plus className="h-4 w-4" /> New Workflow
          </Button>
        </div>
      </header>

      {/* Primary Automation Interface */}
      <section>
        <AutomationHub />
      </section>

      {/* Automation Logs Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
           <h2 className="text-2xl font-black tracking-tighter uppercase italic">Automation <span className="text-accent">Audit Log</span></h2>
           <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">
              <Download className="h-3.5 w-3.5 mr-2" /> Export Audit Trail
           </Button>
        </div>
        
        <div className="creative-card p-0 overflow-hidden border-white/5 bg-black/40">
           <div className="divide-y divide-white/5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                   <div className="flex items-center gap-4">
                      <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                         <Play className="h-3 w-3 text-success fill-current" />
                      </div>
                      <div>
                         <p className="text-xs font-black uppercase tracking-widest">Workflow SHM-{1024 + i} Executed</p>
                         <p className="text-[10px] text-muted-foreground font-mono">Neural Aggregation Protocol // Success // 2.4s</p>
                      </div>
                   </div>
                   <span className="text-[10px] font-black text-muted-foreground uppercase">{10 - i} minutes ago</span>
                </div>
              ))}
           </div>
        </div>
      </section>
    </div>
  );
}
