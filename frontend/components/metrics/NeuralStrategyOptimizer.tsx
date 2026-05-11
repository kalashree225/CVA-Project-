"use client";

import React from "react";
import { Zap, DollarSign, Target, BarChart3, TrendingUp, Loader2 } from "lucide-react";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

const MODELS = [
  { name: "Sentinel-Light", cost: 0.02, latency: 120, accuracy: 82, color: "#10b981" },
  { name: "Sentinel-Pro", cost: 0.15, latency: 450, accuracy: 94, color: "#3b82f6" },
  { name: "Sentinel-Ultra", cost: 1.20, latency: 1200, accuracy: 99, color: "#a855f7" },
];

export function NeuralStrategyOptimizer() {
  const { strategyData, loading } = useAnalytics();

  if (loading && !strategyData) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin opacity-20" />
      </div>
    );
  }

  const activeModel = strategyData?.avg_latency > 1000 ? MODELS[2] : MODELS[1];

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
           <MetricBar label="Real Latency" value={Math.min(100, (strategyData?.avg_latency / 20) || 40)} color="bg-primary" suffix="ms" displayValue={strategyData?.avg_latency || 0} />
           <MetricBar label="Economic Efficiency" value={strategyData?.efficiency_score || 85} color="bg-emerald-500" suffix="%" />
           <MetricBar label="Real Unit Cost" value={Math.min(100, (strategyData?.avg_cost * 100) || 12)} color="bg-blue-500" suffix="$" displayValue={strategyData?.avg_cost || 0} />
        </div>

        <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 transition-all hover:bg-primary/10">
          <p className="text-[10px] leading-relaxed italic text-muted-foreground">
            <strong className="text-primary uppercase not-italic mr-2">Neural Recommendation:</strong> 
            <span className="text-foreground font-bold">{strategyData?.recommendation || "Analyzing vectors..."}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricBar({ label, value, color, suffix, displayValue }: { label: string, value: number, color: string, suffix: string, displayValue?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
        <span>{label}</span>
        <span>{displayValue !== undefined ? displayValue.toFixed(displayValue < 1 ? 4 : 1) : value}{suffix}</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out shadow-[0_0_8px] shadow-current`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
