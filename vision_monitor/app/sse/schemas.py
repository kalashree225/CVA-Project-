from pydantic import BaseModel
from typing import Optional


class MetricEvent(BaseModel):
    event_type: str                          # always "metric_update"
    project_id: str                          # organization_id (UUID string)
    run_id: str                              # InferenceRun.id (UUID string)
    model_name: str
    latency_ms: int
    token_count_input: int
    token_count_output: int
    cost_usd: float
    hallucination_score: Optional[float] = None
    status: str                              # "success" | "failed" | "pending"
    timestamp: str                           # ISO 8601 UTC, e.g. "2024-01-15T10:30:00Z"
