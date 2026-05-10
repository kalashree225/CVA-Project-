import logging
from fastapi import APIRouter, Query
from app.services.metric_service import MetricService
from app.schemas.metrics import MetricsSummaryResponse, TimeSeriesResponse

router = APIRouter(prefix="/api/v1/metrics", tags=["metrics"])
logger = logging.getLogger(__name__)


@router.get("/summary", response_model=MetricsSummaryResponse)
async def get_metrics_summary(
    hours: int = Query(24, ge=1, le=168, description="Hours of data to analyze")
):
    """
    Get metrics summary for the last N hours.
    Includes avg latency per model, total token usage, total cost, and avg hallucination score.
    """
    summary = await MetricService.get_metrics_summary(hours)
    return summary


@router.get("/timeseries", response_model=TimeSeriesResponse)
async def get_timeseries(
    metric: str = Query(..., description="Metric name (e.g., latency_ms, token_count_output)"),
    model: str = Query(..., description="Model name"),
    hours: int = Query(6, ge=1, le=168, description="Hours of data to retrieve")
):
    """
    Get time-series data for a specific metric and model.
    Returns raw data points with timestamps.
    """
    data = await MetricService.get_timeseries(metric, model, hours)
    
    return TimeSeriesResponse(
        metric=metric,
        model=model,
        hours=hours,
        data=data
    )
