// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "user" | "viewer";
  organization_id: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: "bearer";
}

// ─── Inference ───────────────────────────────────────────────────────────────

export type InputType = "text" | "image" | "multimodal";
export type RunStatus = "pending" | "running" | "completed" | "failed";

export interface InferenceRun {
  id: string;
  model_name: string;
  input_type: InputType;
  status: RunStatus;
  latency_ms: number | null;
  token_count_input: number | null;
  token_count_output: number | null;
  cost_usd: number | null;
  hallucination_score: number | null;
  trace_id: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface InferenceRequest {
  model: string;
  input_type: InputType;
  text?: string;
  image_url?: string;
}

export interface InferenceResponse {
  run_id: string;
  status: RunStatus;
  trace_id: string | null;
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export interface MetricSummary {
  total_requests: number;
  avg_latency_ms: number;
  total_tokens: number;
  total_cost_usd: number;
  avg_hallucination_score: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export type AlertOperator = "gt" | "lt" | "gte" | "lte" | "eq";

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: AlertOperator;
  threshold: number;
  webhook_url: string | null;
  is_active: boolean;
  organization_id: string;
  created_at: string;
}

export interface AlertEvent {
  id: string;
  rule_id: string;
  rule_name: string;
  metric: string;
  value: number;
  threshold: number;
  triggered_at: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface MetricStats {
  count: number;
  mean: number;
  median: number;
  std_dev: number;
  min: number;
  max: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface StatisticalSummary {
  model_name: string | null;
  period_hours: number;
  total_runs: number;
  metrics: {
    latency_ms?: MetricStats;
    input_tokens?: MetricStats;
    output_tokens?: MetricStats;
    total_tokens?: MetricStats;
    cost_usd?: MetricStats;
    hallucination_score?: MetricStats;
  };
}

export type TrendDirection = "increasing" | "decreasing" | "stable" | "insufficient_data";

export interface TrendAnalysis {
  metric: string;
  model_name: string;
  trend: TrendDirection;
  slope: number;
  confidence: number;
  data_points: number;
  period_hours: number;
  current_value: number;
  start_value: number;
  change_percent: number;
}

export interface ModelComparisonRankings {
  fastest: string | null;
  cheapest: string | null;
  most_accurate: string | null;
}

export interface ModelComparison {
  models: Record<string, StatisticalSummary>;
  period_hours: number;
  rankings: ModelComparisonRankings;
}

// ─── Anomaly ─────────────────────────────────────────────────────────────────

export type AnomalySeverity = "high" | "medium" | "low";

export interface Anomaly {
  value: number;
  timestamp: string;
  run_id: string;
  z_score?: number;
  severity: AnomalySeverity;
}

export interface AnomalyDetectionResult {
  model_name: string;
  metric: string;
  method: string;
  anomalies: Anomaly[];
  statistics: {
    mean: number;
    std_dev: number;
    median: number;
    min: number;
    max: number;
    count: number;
  };
  anomaly_count: number;
  total_points: number;
  threshold_std: number;
  period_hours: number;
  detected_at: string;
}

// ─── Media ───────────────────────────────────────────────────────────────────

export interface MediaLog {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  minio_key: string;
  organization_id: string;
  created_at: string;
}

// ─── Health ──────────────────────────────────────────────────────────────────

export type ServiceStatus = "healthy" | "degraded" | "unhealthy";

export interface ServiceHealth {
  status: ServiceStatus;
  latency_ms?: number;
  error?: string;
}

export interface HealthStatus {
  status: ServiceStatus;
  services: Record<string, ServiceHealth>;
  timestamp: string;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
