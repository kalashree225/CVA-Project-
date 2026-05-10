"""Anomaly detection router for anomaly detection endpoints."""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel

from app.anomaly.detector import AnomalyDetector

router = APIRouter(prefix="/api/v1/anomaly", tags=["anomaly"])


@router.get("/detect")
async def detect_anomalies(
    model_name: str = Query(...),
    metric: str = Query("latency_ms"),
    hours: int = Query(24, ge=1, le=8760),
    method: str = Query("statistical"),
    threshold_std: float = Query(3.0, ge=1.0, le=10.0)
):
    """
    Detect anomalies in metrics data.
    
    Returns detected anomalies and statistics.
    """
    try:
        result = await AnomalyDetector.detect_anomalies(
            model_name=model_name,
            metric=metric,
            hours=hours,
            method=method,
            threshold_std=threshold_std
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/drift")
async def detect_performance_drift(
    model_name: str = Query(...),
    metric: str = Query("latency_ms"),
    window_hours: int = Query(1, ge=1, le=24),
    baseline_hours: int = Query(24, ge=1, le=168),
    drift_threshold: float = Query(0.2, ge=0.01, le=1.0)
):
    """
    Detect performance drift compared to historical baseline.
    
    Returns drift detection results.
    """
    try:
        result = await AnomalyDetector.detect_performance_drift(
            model_name=model_name,
            metric=metric,
            window_hours=window_hours,
            baseline_hours=baseline_hours,
            drift_threshold=drift_threshold
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def get_anomaly_summary(
    models: Optional[List[str]] = Query(None),
    hours: int = Query(24, ge=1, le=8760)
):
    """
    Get anomaly summary across multiple models and metrics.
    
    Returns summary of anomalies across all models.
    """
    try:
        result = await AnomalyDetector.get_anomaly_summary(
            models=models,
            hours=hours
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
