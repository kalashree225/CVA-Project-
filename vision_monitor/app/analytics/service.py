"""Advanced Analytics Service for statistical analysis and insights."""

import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from collections import defaultdict
import statistics

from app.services.metric_service import MetricService
from app.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.run import InferenceRun

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for advanced analytics and statistical analysis."""
    
    @staticmethod
    async def get_statistical_summary(
        model_name: Optional[str] = None,
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Get comprehensive statistical summary for inference metrics.
        
        Returns mean, median, std dev, percentiles for latency, tokens, cost, hallucination.
        """
        try:
            db = get_db()
            async with db as session:
                # Query inference runs
                query = select(InferenceRun)
                cutoff = datetime.utcnow() - timedelta(hours=hours)
                
                if model_name:
                    query = query.where(InferenceRun.model_name == model_name)
                
                query = query.where(InferenceRun.created_at >= cutoff)
                query = query.where(InferenceRun.status == "completed")
                
                result = await session.execute(query)
                runs = result.scalars().all()
                
                if not runs:
                    return {
                        "model_name": model_name,
                        "period_hours": hours,
                        "total_runs": 0,
                        "metrics": {}
                    }
                
                # Extract metrics
                latencies = [r.latency_ms for r in runs if r.latency_ms]
                input_tokens = [r.token_count_input for r in runs if r.token_count_input]
                output_tokens = [r.token_count_output for r in runs if r.token_count_output]
                costs = [r.cost_usd for r in runs if r.cost_usd]
                hallucinations = [r.hallucination_score for r in runs if r.hallucination_score is not None]
                
                # Calculate statistics
                def calculate_stats(values: List[float]) -> Dict[str, float]:
                    if not values:
                        return {}
                    sorted_values = sorted(values)
                    n = len(values)
                    return {
                        "count": n,
                        "mean": statistics.mean(values),
                        "median": statistics.median(values),
                        "std_dev": statistics.stdev(values) if n > 1 else 0,
                        "min": min(values),
                        "max": max(values),
                        "p25": sorted_values[int(n * 0.25)],
                        "p50": sorted_values[int(n * 0.50)],
                        "p75": sorted_values[int(n * 0.75)],
                        "p90": sorted_values[int(n * 0.90)],
                        "p95": sorted_values[int(n * 0.95)],
                        "p99": sorted_values[int(n * 0.99)],
                    }
                
                return {
                    "model_name": model_name,
                    "period_hours": hours,
                    "total_runs": len(runs),
                    "metrics": {
                        "latency_ms": calculate_stats(latencies),
                        "input_tokens": calculate_stats(input_tokens),
                        "output_tokens": calculate_stats(output_tokens),
                        "total_tokens": calculate_stats([i + o for i, o in zip(input_tokens, output_tokens)]),
                        "cost_usd": calculate_stats(costs),
                        "hallucination_score": calculate_stats(hallucinations) if hallucinations else {},
                    }
                }
        except Exception as e:
            logger.error(f"Statistical summary failed: {e}")
            raise
    
    @staticmethod
    async def get_trend_analysis(
        metric: str,
        model_name: str,
        hours: int = 168
    ) -> Dict[str, Any]:
        """
        Analyze trends for a specific metric over time.
        
        Returns trend direction, slope, and confidence.
        """
        try:
            # Get time-series data from InfluxDB
            data = await MetricService.get_timeseries(metric, model_name, hours)
            
            if len(data) < 2:
                return {
                    "metric": metric,
                    "model_name": model_name,
                    "trend": "insufficient_data",
                    "slope": 0,
                    "confidence": 0,
                    "data_points": len(data)
                }
            
            # Sort by timestamp
            sorted_data = sorted(data, key=lambda x: x["timestamp"])
            values = [d["value"] for d in sorted_data]
            
            # Calculate linear regression
            n = len(values)
            x = list(range(n))
            
            sum_x = sum(x)
            sum_y = sum(values)
            sum_xy = sum(x[i] * values[i] for i in range(n))
            sum_x2 = sum(x[i] ** 2 for i in range(n))
            
            # Calculate slope (trend)
            denominator = n * sum_x2 - sum_x ** 2
            if denominator == 0:
                slope = 0
            else:
                slope = (n * sum_xy - sum_x * sum_y) / denominator
            
            # Calculate R-squared (confidence)
            y_mean = sum_y / n
            ss_total = sum((v - y_mean) ** 2 for v in values)
            
            if ss_total == 0:
                r_squared = 1.0
            else:
                y_pred = [slope * xi + (sum_y - slope * sum_x) / n for xi in x]
                ss_residual = sum((values[i] - y_pred[i]) ** 2 for i in range(n))
                r_squared = 1 - (ss_residual / ss_total)
            
            # Determine trend direction
            if abs(slope) < 0.01 * (max(values) - min(values) + 0.001):
                trend = "stable"
            elif slope > 0:
                trend = "increasing"
            else:
                trend = "decreasing"
            
            return {
                "metric": metric,
                "model_name": model_name,
                "trend": trend,
                "slope": slope,
                "confidence": max(0, min(1, r_squared)),
                "data_points": n,
                "period_hours": hours,
                "current_value": values[-1],
                "start_value": values[0],
                "change_percent": ((values[-1] - values[0]) / abs(values[0]) * 100) if values[0] != 0 else 0
            }
        except Exception as e:
            logger.error(f"Trend analysis failed: {e}")
            raise
    
    @staticmethod
    async def get_correlation_matrix(
        metrics: List[str],
        model_name: str,
        hours: int = 168
    ) -> Dict[str, Dict[str, float]]:
        """
        Calculate correlation matrix between metrics.
        
        Returns pairwise correlation coefficients.
        """
        try:
            correlations = {}
            
            for i, metric1 in enumerate(metrics):
                correlations[metric1] = {}
                data1 = await MetricService.get_timeseries(metric1, model_name, hours)
                values1 = [d["value"] for d in data1]
                
                for metric2 in metrics[i:]:
                    data2 = await MetricService.get_timeseries(metric2, model_name, hours)
                    values2 = [d["value"] for d in data2]
                    
                    # Align data points by index
                    min_len = min(len(values1), len(values2))
                    aligned1 = values1[:min_len]
                    aligned2 = values2[:min_len]
                    
                    if min_len < 2:
                        correlations[metric1][metric2] = 0.0
                        continue
                    
                    # Calculate Pearson correlation
                    mean1 = statistics.mean(aligned1)
                    mean2 = statistics.mean(aligned2)
                    
                    numerator = sum((x - mean1) * (y - mean2) for x, y in zip(aligned1, aligned2))
                    denominator = (
                        statistics.stdev(aligned1) * statistics.stdev(aligned2) * min_len
                    )
                    
                    if denominator == 0:
                        correlation = 0.0
                    else:
                        correlation = numerator / denominator
                    
                    correlations[metric1][metric2] = round(correlation, 4)
                    
                    if metric1 != metric2:
                        correlations[metric2] = correlations.get(metric2, {})
                        correlations[metric2][metric1] = correlation
            
            return correlations
        except Exception as e:
            logger.error(f"Correlation matrix failed: {e}")
            raise
    
    @staticmethod
    async def get_performance_degradation(
        model_name: str,
        threshold_percent: float = 20.0,
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Detect performance degradation compared to baseline.
        
        Compares recent performance to historical baseline.
        """
        try:
            db = get_db()
            async with db as session:
                # Get recent runs
                recent_cutoff = datetime.utcnow() - timedelta(hours=hours)
                baseline_cutoff = datetime.utcnow() - timedelta(hours=hours * 2)
                
                recent_query = select(InferenceRun).where(
                    InferenceRun.model_name == model_name,
                    InferenceRun.created_at >= recent_cutoff,
                    InferenceRun.status == "completed"
                )
                
                baseline_query = select(InferenceRun).where(
                    InferenceRun.model_name == model_name,
                    InferenceRun.created_at >= baseline_cutoff,
                    InferenceRun.created_at < recent_cutoff,
                    InferenceRun.status == "completed"
                )
                
                recent_result = await session.execute(recent_query)
                recent_runs = recent_result.scalars().all()
                
                baseline_result = await session.execute(baseline_query)
                baseline_runs = baseline_result.scalars().all()
                
                if not recent_runs or not baseline_runs:
                    return {
                        "model_name": model_name,
                        "degradation_detected": False,
                        "reason": "insufficient_data"
                    }
                
                # Calculate averages
                recent_avg_latency = statistics.mean([r.latency_ms for r in recent_runs if r.latency_ms])
                baseline_avg_latency = statistics.mean([r.latency_ms for r in baseline_runs if r.latency_ms])
                
                recent_avg_cost = statistics.mean([r.cost_usd for r in recent_runs if r.cost_usd])
                baseline_avg_cost = statistics.mean([r.cost_usd for r in baseline_runs if r.cost_usd])
                
                # Calculate degradation
                latency_change = ((recent_avg_latency - baseline_avg_latency) / baseline_avg_latency * 100) if baseline_avg_latency > 0 else 0
                cost_change = ((recent_avg_cost - baseline_avg_cost) / baseline_avg_cost * 100) if baseline_avg_cost > 0 else 0
                
                degradation_detected = (
                    latency_change > threshold_percent or
                    cost_change > threshold_percent
                )
                
                return {
                    "model_name": model_name,
                    "degradation_detected": degradation_detected,
                    "threshold_percent": threshold_percent,
                    "latency": {
                        "baseline": baseline_avg_latency,
                        "recent": recent_avg_latency,
                        "change_percent": latency_change
                    },
                    "cost": {
                        "baseline": baseline_avg_cost,
                        "recent": recent_avg_cost,
                        "change_percent": cost_change
                    },
                    "recent_runs": len(recent_runs),
                    "baseline_runs": len(baseline_runs)
                }
        except Exception as e:
            logger.error(f"Performance degradation check failed: {e}")
            raise
    
    @staticmethod
    async def get_model_comparison(
        models: List[str],
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Compare multiple models across key metrics.
        
        Returns side-by-side comparison of performance.
        """
        try:
            comparisons = {}
            
            for model in models:
                stats = await AnalyticsService.get_statistical_summary(model, hours)
                comparisons[model] = stats
            
            # Find best model for each metric
            best_latency = min(
                comparisons.items(),
                key=lambda x: x[1]["metrics"].get("latency_ms", {}).get("mean", float("inf"))
            ) if comparisons else None
            
            best_cost = min(
                comparisons.items(),
                key=lambda x: x[1]["metrics"].get("cost_usd", {}).get("mean", float("inf"))
            ) if comparisons else None
            
            best_hallucination = min(
                [(k, v) for k, v in comparisons.items() if v["metrics"].get("hallucination_score")],
                key=lambda x: x[1]["metrics"]["hallucination_score"].get("mean", float("inf"))
            ) if comparisons else None
            
            return {
                "models": comparisons,
                "period_hours": hours,
                "rankings": {
                    "fastest": best_latency[0] if best_latency else None,
                    "cheapest": best_cost[0] if best_cost else None,
                    "most_accurate": best_hallucination[0] if best_hallucination else None
                }
            }
        except Exception as e:
            logger.error(f"Model comparison failed: {e}")
            raise
    
    @staticmethod
    async def get_forecast(
        metric: str,
        model_name: str,
        forecast_hours: int = 24,
        history_hours: int = 168
    ) -> Dict[str, Any]:
        """
        Simple forecast using moving average.
        
        Returns forecasted values for the next N hours.
        """
        try:
            # Get historical data
            data = await MetricService.get_timeseries(metric, model_name, history_hours)
            
            if len(data) < 10:
                return {
                    "metric": metric,
                    "model_name": model_name,
                    "forecast": [],
                    "error": "insufficient_data"
                }
            
            # Calculate moving average
            values = [d["value"] for d in sorted(data, key=lambda x: x["timestamp"])]
            window_size = min(10, len(values) // 2)
            
            def moving_average(values, window):
                return [statistics.mean(values[i:i+window]) for i in range(len(values) - window + 1)]
            
            ma_values = moving_average(values, window_size)
            last_ma = ma_values[-1]
            
            # Simple forecast: assume last trend continues
            if len(ma_values) >= 2:
                trend = (ma_values[-1] - ma_values[-2]) / len(ma_values[-10:])
            else:
                trend = 0
            
            # Generate forecast
            forecast = []
            for i in range(1, forecast_hours + 1):
                forecast_value = last_ma + (trend * i)
                forecast.append({
                    "hour": i,
                    "timestamp": (datetime.utcnow() + timedelta(hours=i)).isoformat(),
                    "predicted_value": forecast_value
                })
            
            return {
                "metric": metric,
                "model_name": model_name,
                "forecast": forecast,
                "method": "moving_average",
                "history_hours": history_hours,
                "forecast_hours": forecast_hours
            }
        except Exception as e:
            logger.error(f"Forecast failed: {e}")
            raise
