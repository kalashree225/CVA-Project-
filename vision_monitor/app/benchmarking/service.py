"""Benchmarking service for model comparison and performance evaluation."""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import statistics

from app.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.run import InferenceRun

logger = logging.getLogger(__name__)


class BenchmarkingService:
    """Service for model benchmarking and comparison."""
    
    @staticmethod
    async def run_benchmark(
        models: List[str],
        test_cases: List[Dict[str, Any]],
        triggered_by: str
    ) -> Dict[str, Any]:
        """
        Run a benchmark comparing multiple models on the same test cases.
        
        Returns benchmark results with performance metrics for each model.
        """
        try:
            benchmark_id = f"benchmark_{datetime.utcnow().timestamp()}"
            results = {}
            
            for model in models:
                model_results = []
                
                for test_case in test_cases:
                    # In a real implementation, you would call the inference service here
                    # For now, we'll simulate the results
                    result = {
                        "test_case_id": test_case.get("id"),
                        "model": model,
                        "latency_ms": test_case.get("expected_latency", 1000) + (hash(model) % 500),
                        "cost_usd": test_case.get("expected_cost", 0.01) * (hash(model) % 3),
                        "hallucination_score": (hash(model) % 100) / 100,
                        "quality_score": 0.8 + ((hash(model) % 20) / 100),
                    }
                    model_results.append(result)
                
                results[model] = model_results
            
            # Calculate aggregate statistics
            benchmark_summary = BenchmarkingService._calculate_benchmark_summary(results)
            
            return {
                "benchmark_id": benchmark_id,
                "models": models,
                "test_cases_count": len(test_cases),
                "results": results,
                "summary": benchmark_summary,
                "triggered_by": triggered_by,
                "created_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Benchmark execution failed: {e}")
            raise
    
    @staticmethod
    def _calculate_benchmark_summary(results: Dict[str, List[Dict]]) -> Dict[str, Any]:
        """Calculate summary statistics from benchmark results."""
        summary = {}
        
        for model, model_results in results.items():
            latencies = [r["latency_ms"] for r in model_results]
            costs = [r["cost_usd"] for r in model_results]
            hallucinations = [r["hallucination_score"] for r in model_results]
            qualities = [r["quality_score"] for r in model_results]
            
            summary[model] = {
                "avg_latency_ms": statistics.mean(latencies),
                "median_latency_ms": statistics.median(latencies),
                "total_cost_usd": sum(costs),
                "avg_cost_usd": statistics.mean(costs),
                "avg_hallucination_score": statistics.mean(hallucinations),
                "avg_quality_score": statistics.mean(qualities),
                "success_rate": 1.0,  # Assuming all succeeded
            }
        
        return summary
    
    @staticmethod
    async def get_historical_benchmarks(
        model: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get historical benchmark results.
        
        Returns past benchmarks for comparison.
        """
        try:
            # In a real implementation, this would query a benchmark history table
            # For now, return mock data
            return [
                {
                    "benchmark_id": f"benchmark_{i}",
                    "models": ["llava-1.5", "gpt-4-vision"],
                    "created_at": (datetime.utcnow() - timedelta(hours=i)).isoformat(),
                    "summary": {
                        "llava-1.5": {"avg_latency_ms": 1200 + i * 10, "avg_cost_usd": 0.01},
                        "gpt-4-vision": {"avg_latency_ms": 800 + i * 5, "avg_cost_usd": 0.03},
                    }
                }
                for i in range(limit)
            ]
        except Exception as e:
            logger.error(f"Failed to get historical benchmarks: {e}")
            raise
    
    @staticmethod
    async def compare_models(
        models: List[str],
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Compare models based on recent inference data.
        
        Returns side-by-side performance comparison.
        """
        try:
            db = get_db()
            async with db as session:
                cutoff = datetime.utcnow() - timedelta(hours=hours)
                comparison = {}
                
                for model in models:
                    query = select(InferenceRun).where(
                        InferenceRun.model_name == model,
                        InferenceRun.created_at >= cutoff,
                        InferenceRun.status == "completed"
                    )
                    
                    result = await session.execute(query)
                    runs = result.scalars().all()
                    
                    if runs:
                        latencies = [r.latency_ms for r in runs if r.latency_ms]
                        costs = [r.cost_usd for r in runs if r.cost_usd]
                        hallucinations = [r.hallucination_score for r in runs if r.hallucination_score is not None]
                        
                        comparison[model] = {
                            "run_count": len(runs),
                            "avg_latency_ms": statistics.mean(latencies) if latencies else 0,
                            "median_latency_ms": statistics.median(latencies) if latencies else 0,
                            "p95_latency_ms": sorted(latencies)[int(len(latencies) * 0.95)] if latencies else 0,
                            "total_cost_usd": sum(costs),
                            "avg_cost_usd": statistics.mean(costs) if costs else 0,
                            "avg_hallucination_score": statistics.mean(hallucinations) if hallucinations else 0,
                            "min_latency_ms": min(latencies) if latencies else 0,
                            "max_latency_ms": max(latencies) if latencies else 0,
                        }
                    else:
                        comparison[model] = {
                            "run_count": 0,
                            "avg_latency_ms": 0,
                            "median_latency_ms": 0,
                            "p95_latency_ms": 0,
                            "total_cost_usd": 0,
                            "avg_cost_usd": 0,
                            "avg_hallucination_score": 0,
                            "min_latency_ms": 0,
                            "max_latency_ms": 0,
                        }
                
                # Calculate rankings
                rankings = BenchmarkingService._calculate_rankings(comparison)
                
                return {
                    "models": comparison,
                    "rankings": rankings,
                    "period_hours": hours,
                    "comparison_at": datetime.utcnow().isoformat()
                }
        except Exception as e:
            logger.error(f"Model comparison failed: {e}")
            raise
    
    @staticmethod
    def _calculate_rankings(comparison: Dict[str, Dict]) -> Dict[str, str]:
        """Calculate rankings for different metrics."""
        rankings = {}
        
        # Fastest (lowest latency)
        fastest = min(comparison.items(), key=lambda x: x[1]["avg_latency_ms"])
        rankings["fastest"] = fastest[0]
        
        # Cheapest (lowest cost)
        cheapest = min(comparison.items(), key=lambda x: x[1]["avg_cost_usd"])
        rankings["cheapest"] = cheapest[0]
        
        # Most accurate (lowest hallucination)
        most_accurate = min(
            [(k, v) for k, v in comparison.items() if v["avg_hallucination_score"] > 0],
            key=lambda x: x[1]["avg_hallucination_score"]
        )
        rankings["most_accurate"] = most_accurate[0] if most_accurate else None
        
        # Most stable (lowest latency variance)
        most_stable = min(
            comparison.items(),
            key=lambda x: x[1]["p95_latency_ms"] - x[1]["median_latency_ms"]
        )
        rankings["most_stable"] = most_stable[0]
        
        return rankings
    
    @staticmethod
    async def get_performance_trends(
        model: str,
        metric: str = "latency_ms",
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Get performance trends for a model over time.
        
        Returns daily aggregated metrics for trend analysis.
        """
        try:
            db = get_db()
            async with db as session:
                cutoff = datetime.utcnow() - timedelta(days=days)
                
                # Query runs grouped by day
                # In a real implementation, use SQL date truncation
                query = select(InferenceRun).where(
                    InferenceRun.model_name == model,
                    InferenceRun.created_at >= cutoff,
                    InferenceRun.status == "completed"
                )
                
                result = await session.execute(query)
                runs = result.scalars().all()
                
                # Group by day
                daily_data = {}
                for run in runs:
                    day = run.created_at.date().isoformat()
                    if day not in daily_data:
                        daily_data[day] = []
                    
                    value = getattr(run, metric, 0)
                    if value is not None:
                        daily_data[day].append(value)
                
                # Calculate daily statistics
                trends = []
                for day, values in sorted(daily_data.items()):
                    trends.append({
                        "date": day,
                        "mean": statistics.mean(values),
                        "median": statistics.median(values),
                        "min": min(values),
                        "max": max(values),
                        "count": len(values)
                    })
                
                return {
                    "model": model,
                    "metric": metric,
                    "period_days": days,
                    "trends": trends
                }
        except Exception as e:
            logger.error(f"Performance trends failed: {e}")
            raise
