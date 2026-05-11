from pydantic import BaseModel
from typing import Optional, Dict, Any, List


class MetricsSummaryResponse(BaseModel):
    avg_latency_per_model: Dict[str, float]
    total_token_usage: int
    total_estimated_cost: float
    total_requests: int = 0
    avg_latency_ms: float = 0
    total_cost_usd: float = 0
    avg_hallucination_score: float
    period_hours: int


class TimeSeriesDataPoint(BaseModel):
    timestamp: str
    value: float


class TimeSeriesResponse(BaseModel):
    metric: str
    model: str
    hours: int
    data: List[TimeSeriesDataPoint]
    data_points: List[TimeSeriesDataPoint] = []
