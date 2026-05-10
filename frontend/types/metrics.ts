// ─── SSE Streaming Types ─────────────────────────────────────────────────────
// Requirements: 5.2, 6.1

/**
 * Represents a real-time metric event received over SSE.
 * Each event corresponds to a single inference run result streamed from the backend.
 */
export interface MetricEvent {
  event_type: "metric_update";
  project_id: string;
  run_id: string;
  model_name: string;
  latency_ms: number;
  token_count_input: number;
  token_count_output: number;
  cost_usd: number;
  hallucination_score: number | null;
  status: "success" | "failed" | "pending";
  timestamp: string;
}

/**
 * Represents the current state of the SSE connection to the backend.
 */
export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";
