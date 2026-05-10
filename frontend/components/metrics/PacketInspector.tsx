"use client";

import { useState } from "react";
import { useMetricsStore } from "@/lib/store/metricsStore";
import { cn } from "@/lib/utils";
import { X, Copy, Code2, Database, Cpu, Activity } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export function PacketInspector() {
  const { selectedEvent, setSelectedEvent } = useMetricsStore();
  
  if (!selectedEvent) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(selectedEvent, null, 2));
    toast.success("Payload copied to clipboard");
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div 
        className="w-full max-w-2xl bg-card border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <Code2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter italic">Packet <span className="text-primary">Inspector</span></h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Telemetry Stream: {selectedEvent.run_id}</p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedEvent(null)}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Latency</p>
              <p className="text-lg font-bold">{selectedEvent.latency_ms}ms</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Tokens</p>
              <p className="text-lg font-bold">{selectedEvent.token_count_input + selectedEvent.token_count_output}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Cost</p>
              <p className="text-lg font-bold">${selectedEvent.cost_usd.toFixed(4)}</p>
            </div>
          </div>

          {/* Raw JSON View */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" /> Raw Telemetry Payload
              </h3>
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2 text-[10px] h-7">
                <Copy className="h-3.3 w-3.3" /> Copy JSON
              </Button>
            </div>
            <div className="relative rounded-2xl bg-black border border-white/5 p-6 font-mono text-xs leading-relaxed text-emerald-500/90 overflow-x-auto shadow-inner">
              <pre>{JSON.stringify(selectedEvent, null, 2)}</pre>
            </div>
          </div>

          {/* System Analysis */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" /> Intelligence Analysis
            </h3>
            <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
               <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                    <p className="text-sm text-muted-foreground">
                      Model <span className="text-foreground font-bold">{selectedEvent.model_name}</span> responded with nominal hallucination score of <span className="text-foreground font-bold">{selectedEvent.hallucination_score?.toFixed(3) || 'N/A'}</span>.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
                    <p className="text-sm text-muted-foreground">
                      Inference status confirmed as <span className="text-success font-bold uppercase tracking-tighter italic">{selectedEvent.status}</span>.
                    </p>
                  </li>
               </ul>
            </div>
          </div>
        </div>

        <footer className="p-6 border-t border-white/5 bg-white/5">
          <Button className="w-full py-6 text-lg uppercase font-black tracking-[0.2em] italic" onClick={() => setSelectedEvent(null)}>
            Close Inspector
          </Button>
        </footer>
      </div>
    </div>
  );
}
