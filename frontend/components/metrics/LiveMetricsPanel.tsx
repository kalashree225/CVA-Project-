"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useMetricsStore } from "@/lib/store/metricsStore";
import { useMetricsStream } from "@/lib/hooks/useMetricsStream";
import { apiClient } from "@/lib/api/client";
import { cn, formatNumber, formatDuration, formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Activity, Clock, DollarSign, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function LiveMetricsPanel() {
  const user = useAuthStore((state) => state.user);
  const { 
    events, 
    averageLatencyMs, 
    totalCostUsd,
  } = useMetricsStore();
  
  useMetricsStream(user?.organization_id ?? undefined);

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
        title="Throughput"
        value={formatNumber(totalRequests)}
        icon={<Activity className="h-4 w-4" />}
        description="Packets processed"
        trend="+12.5%"
        trendUp={true}
        color="blue"
      />
      <MetricCard
        title="Latency"
        value={formatDuration(avgLatency)}
        icon={<Clock className="h-4 w-4" />}
        description="Avg response time"
        trend="-4.2ms"
        trendUp={true}
        color="emerald"
      />
      <MetricCard
        title="Computed Cost"
        value={formatCurrency(totalCost)}
        icon={<DollarSign className="h-4 w-4" />}
        description="Session burn"
        trend="$0.12/hr"
        trendUp={false}
        color="violet"
      />
      <MetricCard
        title="Risk Score"
        value={liveHallucinationScore.toFixed(3)}
        icon={<AlertCircle className="h-4 w-4" />}
        description="Anomaly confidence"
        trend="Nominal"
        trendUp={true}
        color="amber"
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
  color: "blue" | "emerald" | "violet" | "amber";
}

function MetricCard({ title, value, icon, description, trend, trendUp, color }: MetricCardProps) {
  const colorMap = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    violet: "text-violet-600 bg-violet-50 border-violet-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
  };

  return (
    <div className="pro-card group">
      <div className="flex items-start justify-between">
        <div className={cn("p-2 rounded-lg border", colorMap[color])}>
          {icon}
        </div>
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border",
          trendUp ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-rose-600 bg-rose-50 border-rose-100"
        )}>
          {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {trend}
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
        <h3 className="text-2xl font-bold tracking-tight mt-1 text-foreground">
          {value}
        </h3>
        <p className="text-[10px] font-medium text-muted-foreground mt-2 flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-border" /> {description}
        </p>
      </div>
    </div>
  );
}

export default LiveMetricsPanel;
