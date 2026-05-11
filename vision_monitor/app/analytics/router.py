"""Analytics router for advanced analytics endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel

from app.analytics.service import AnalyticsService
from app.database import get_db

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


# Request/Response Models
class StatisticalSummaryRequest(BaseModel):
    model_name: Optional[str] = None
    hours: int = 24


class TrendAnalysisRequest(BaseModel):
    metric: str
    model_name: str
    hours: int = 168


class CorrelationMatrixRequest(BaseModel):
    metrics: List[str]
    model_name: str
    hours: int = 168


class PerformanceDegradationRequest(BaseModel):
    model_name: str
    threshold_percent: float = 20.0
    hours: int = 24


class ModelComparisonRequest(BaseModel):
    models: List[str]
    hours: int = 24


class ForecastRequest(BaseModel):
    metric: str
    model_name: str
    forecast_hours: int = 24
    history_hours: int = 168


@router.get("/statistical-summary")
async def get_statistical_summary(
    model_name: Optional[str] = Query(None),
    hours: int = Query(24, ge=1, le=8760)
):
    """
    Get comprehensive statistical summary for inference metrics.
    
    Returns mean, median, std dev, percentiles for latency, tokens, cost, hallucination.
    """
    try:
        summary = await AnalyticsService.get_statistical_summary(model_name, hours)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trend-analysis")
async def get_trend_analysis(
    metric: str = Query(...),
    model_name: str = Query(...),
    hours: int = Query(168, ge=1, le=8760)
):
    """
    Analyze trends for a specific metric over time.
    
    Returns trend direction, slope, and confidence.
    """
    try:
        analysis = await AnalyticsService.get_trend_analysis(metric, model_name, hours)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/correlation-matrix")
async def get_correlation_matrix(
    metrics: List[str] = Query(...),
    model_name: str = Query(...),
    hours: int = Query(168, ge=1, le=8760)
):
    """
    Calculate correlation matrix between metrics.
    
    Returns pairwise correlation coefficients.
    """
    try:
        matrix = await AnalyticsService.get_correlation_matrix(metrics, model_name, hours)
        return matrix
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/performance-degradation")
async def get_performance_degradation(
    model_name: str = Query(...),
    threshold_percent: float = Query(20.0, ge=0, le=100),
    hours: int = Query(24, ge=1, le=8760)
):
    """
    Detect performance degradation compared to baseline.
    
    Compares recent performance to historical baseline.
    """
    try:
        degradation = await AnalyticsService.get_performance_degradation(
            model_name, threshold_percent, hours
        )
        return degradation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model-comparison")
async def get_model_comparison(
    models: List[str] = Query(...),
    hours: int = Query(24, ge=1, le=8760)
):
    """
    Compare multiple models across key metrics.
    
    Returns side-by-side comparison of performance.
    """
    try:
        comparison = await AnalyticsService.get_model_comparison(models, hours)
        return comparison
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/forecast")
async def get_forecast(
    metric: str = Query(...),
    model_name: str = Query(...),
    forecast_hours: int = Query(24, ge=1, le=168),
    history_hours: int = Query(168, ge=1, le=8760)
):
    """
    Simple forecast using moving average.
    
    Returns forecasted values for the next N hours.
    """
    try:
        forecast = await AnalyticsService.get_forecast(
            metric, model_name, forecast_hours, history_hours
        )
        return forecast
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/risk-density")
async def get_risk_density():
    """Calculate real risk density based on historical inference anomalies."""
    return await AnalyticsService.get_risk_density()


@router.get("/strategy-optimizer")
async def get_strategy_optimizer():
    """Compute real model efficiency metrics from the database."""
    return await AnalyticsService.get_strategy_optimizer()
