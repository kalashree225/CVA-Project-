"use client";

import React, { useMemo } from "react";
import { Zap, DollarSign, Target, BarChart3, TrendingUp } from "lucide-react";

const MODELS = [
  { name: "Sentinel-Light (Ollama)", cost: 0.02, latency: 120, accuracy: 82, color: "#10b981" },
  { name: "Sentinel-Pro (LLaVA)", cost: 0.15, latency: 450, accuracy: 94, color: "#3b82f6" },
  { name: "Sentinel-Ultra (GPT-4V)", cost: 1.20, latency: 1200, accuracy: 99, color: "#a855f7" },
];

export function NeuralStrategyOptimizer() {
  const activeModel = MODELS[1]; // LLaVA as default

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODELS.map((model) => (
          <div 
            key={model.name}
            className={`p-4 rounded-2xl border transition-all duration-300 ${
              model.name === activeModel.name 
                ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/5" 
                : "bg-white/5 border-white/5 hover:border-white/10"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{model.name}</span>
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: model.color }} />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xl font-black italic tracking-tighter">${model.cost}<span className="text-[10px] font-normal not-italic text-muted-foreground">/run</span></p>
              </div>
              <div className="text-right">
                 <p className="text-xs font-black text-primary">{model.accuracy}% <span className="text-[8px] font-medium text-muted-foreground uppercase tracking-tighter">Acc</span></p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="creative-card bg-black/60 border-white/5 p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <BarChart3 className="h-24 w-24 text-primary" />
        </div>
        
        <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Efficiency <span className="text-primary">Envelope</span>
        </h4>

        <div className="space-y-5">
           <MetricBar label="Latency Offset" value={64} color="bg-primary" suffix="ms" />
           <MetricBar label="Economic Efficiency" value={88} color="bg-emerald-500" suffix="%" />
           <MetricBar label="Neural Load Balancer" value={42} color="bg-blue-500" suffix="%" />
        </div>

        <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-[10px] leading-relaxed italic text-muted-foreground">
            <strong className="text-primary uppercase not-italic mr-2">Strategy Advice:</strong> 
            Current throughput suggests switching to <span className="text-foreground font-bold">Sentinel-Light</span> for the next 4 hours to reduce operational costs by <span className="text-emerald-500 font-bold">12.4%</span> without compromising critical security thresholds.
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricBar({ label, value, color, suffix }: { label: string, value: number, color: string, suffix: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
        <span>{label}</span>
        <span>{value}{suffix}</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
