"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useMetricsStore } from "@/lib/store/metricsStore";
import { useMetricsStream } from "@/lib/hooks/useMetricsStream";
import { apiClient } from "@/lib/api/client";
<<<<<<< HEAD
import { cn, formatNumber, formatDuration, formatCurrency } from "@/lib/utils";
=======
import { formatNumber, formatDuration, formatCurrency } from "@/lib/utils";
>>>>>>> 1f9e1f428c60a05a90a56f90b558cb17b6e52531
import ConnectionStatusIndicator from "./ConnectionStatusIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Activity, Clock, DollarSign, AlertCircle } from "lucide-react";

/**
 * Enterprise-grade Live Metrics Panel.
 * Uses custom UI components and a high-precision design language.
 */
export function LiveMetricsPanel() {
  const user = useAuthStore((state) => state.user);
  const { 
    events, 
    averageLatencyMs, 
    totalCostUsd,
    connectionStatus 
  } = useMetricsStore();
  
<<<<<<< HEAD
  useMetricsStream(user?.organization_id ?? undefined);
=======
  useMetricsStream(user?.organization_id);
>>>>>>> 1f9e1f428c60a05a90a56f90b558cb17b6e52531

  const [fallbackMetrics, setFallbackMetrics] = useState<{
    total_requests: number;
    avg_latency_ms: number;
    total_cost_usd: number;
    avg_hallucination_score: number;
  } | null>(null);

  useEffect(() => {
    if (events.length === 0) {
      apiClient.get("/api/v1/metrics/summary?hours=24")
        .then(setFallbackMetrics)
        .catch((err) => console.error("Failed to fetch fallback metrics", err));
    }
  }, [events.length]);

  const totalRequests = events.length > 0 ? events.length : (fallbackMetrics?.total_requests || 0);
  const avgLatency = events.length > 0 ? (averageLatencyMs || 0) : (fallbackMetrics?.avg_latency_ms || 0);
  const totalCost = events.length > 0 ? totalCostUsd : (fallbackMetrics?.total_cost_usd || 0);
  
  const liveHallucinationScore = events.length > 0
    ? events.filter(e => e.hallucination_score !== null).reduce((sum, e) => sum + (e.hallucination_score || 0), 0) / 
      Math.max(events.filter(e => e.hallucination_score !== null).length, 1)
    : (fallbackMetrics?.avg_hallucination_score || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Active Throughput"
        value={formatNumber(totalRequests)}
        icon={<Activity className="h-5 w-5 text-primary" />}
        description="Packets processed / session"
        trend="+12.5%"
        trendUp={true}
      />
      <MetricCard
        title="Global Latency"
        value={formatDuration(avgLatency)}
        icon={<Clock className="h-5 w-5 text-success" />}
        description="Edge response oscillation"
        trend="-4.2ms"
        trendUp={true} // Lower latency is good
      />
      <MetricCard
        title="Compute Cost"
        value={formatCurrency(totalCost)}
        icon={<DollarSign className="h-5 w-5 text-accent" />}
        description="Session burn rate"
        trend="$0.12/hr"
        trendUp={false}
      />
      <MetricCard
        title="Intelligence Delta"
        value={liveHallucinationScore.toFixed(3)}
        icon={<AlertCircle className="h-5 w-5 text-amber-500" />}
        description="Anomaly confidence score"
        trend="Nominal"
        trendUp={true}
      />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  trend: string;
  trendUp: boolean;
}

function MetricCard({ title, value, icon, description, trend, trendUp }: MetricCardProps) {
  return (
    <div className="creative-card p-5 group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:border-primary/50 transition-colors">
          {icon}
        </div>
        <div className={cn(
          "text-[10px] font-black px-2 py-1 rounded bg-white/5 border border-white/5 uppercase tracking-widest",
          trendUp ? "text-success" : "text-rose-500"
        )}>
          {trend}
        </div>
      </div>
      
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
          {title}
        </h3>
        <div className="text-3xl font-black tracking-tighter italic">
          {value}
        </div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-white/20" /> {description}
        </p>
      </div>

      {/* Decorative background glow */}
      <div className="absolute -bottom-6 -right-6 h-20 w-20 bg-primary/10 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

export default LiveMetricsPanel;
