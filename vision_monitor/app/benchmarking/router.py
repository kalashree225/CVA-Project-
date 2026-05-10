"""Benchmarking router for model comparison and benchmarking endpoints."""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel

from app.benchmarking.service import BenchmarkingService

router = APIRouter(prefix="/api/v1/benchmarking", tags=["benchmarking"])


# Request/Response Models
class RunBenchmarkRequest(BaseModel):
    models: List[str]
    test_cases: List[dict]
    triggered_by: str


class ModelComparisonRequest(BaseModel):
    models: List[str]
    hours: int = 24


@router.post("/run")
async def run_benchmark(request: RunBenchmarkRequest):
    """
    Run a benchmark comparing multiple models on the same test cases.
    
    Returns benchmark results with performance metrics for each model.
    """
    try:
        result = await BenchmarkingService.run_benchmark(
            models=request.models,
            test_cases=request.test_cases,
            triggered_by=request.triggered_by
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/historical")
async def get_historical_benchmarks(
    model: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=100)
):
    """
    Get historical benchmark results.
    
    Returns past benchmarks for comparison.
    """
    try:
        benchmarks = await BenchmarkingService.get_historical_benchmarks(
            model=model,
            limit=limit
        )
        return {
            "benchmarks": benchmarks,
            "count": len(benchmarks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/compare")
async def compare_models(
    models: List[str] = Query(...),
    hours: int = Query(24, ge=1, le=8760)
):
    """
    Compare models based on recent inference data.
    
    Returns side-by-side performance comparison.
    """
    try:
        comparison = await BenchmarkingService.compare_models(models, hours)
        return comparison
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends")
async def get_performance_trends(
    model: str = Query(...),
    metric: str = Query("latency_ms"),
    days: int = Query(7, ge=1, le=90)
):
    """
    Get performance trends for a model over time.
    
    Returns daily aggregated metrics for trend analysis.
    """
    try:
        trends = await BenchmarkingService.get_performance_trends(
            model=model,
            metric=metric,
            days=days
        )
        return trends
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
