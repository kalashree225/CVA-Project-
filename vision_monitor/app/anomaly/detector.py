"""Anomaly detection using statistical and ML methods."""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import statistics

from app.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.run import InferenceRun

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """Detect anomalies in inference metrics using statistical and ML methods."""
    
    @staticmethod
    async def detect_anomalies(
        model_name: str,
        metric: str = "latency_ms",
        hours: int = 24,
        method: str = "statistical",
        threshold_std: float = 3.0
    ) -> Dict[str, Any]:
        """
        Detect anomalies in metrics data.
        
        Args:
            model_name: Name of the model to analyze
            metric: Metric to analyze (latency_ms, cost_usd, hallucination_score)
            hours: Time period to analyze
            method: Detection method (statistical, zscore, iqr)
            threshold_std: Number of standard deviations for threshold
        
        Returns:
            Dictionary with detected anomalies and statistics
        """
        try:
            db = get_db()
            async with db as session:
                cutoff = datetime.utcnow() - timedelta(hours=hours)
                
                query = select(InferenceRun).where(
                    InferenceRun.model_name == model_name,
                    InferenceRun.created_at >= cutoff,
                    InferenceRun.status == "completed"
                )
                
                result = await session.execute(query)
                runs = result.scalars().all()
                
                if not runs:
                    return {
                        "model_name": model_name,
                        "metric": metric,
                        "anomalies": [],
                        "statistics": {},
                        "anomaly_count": 0,
                        "total_points": 0
                    }
                
                # Extract metric values
                values = []
                for run in runs:
                    value = getattr(run, metric, None)
                    if value is not None:
                        values.append({
                            "value": value,
                            "timestamp": run.created_at.isoformat(),
                            "run_id": run.id
                        })
                
                if not values:
                    return {
                        "model_name": model_name,
                        "metric": metric,
                        "anomalies": [],
                        "statistics": {},
                        "anomaly_count": 0,
                        "total_points": 0
                    }
                
                # Calculate statistics
                numeric_values = [v["value"] for v in values]
                mean_val = statistics.mean(numeric_values)
                std_val = statistics.stdev(numeric_values) if len(numeric_values) > 1 else 0
                median_val = statistics.median(numeric_values)
                
                # Detect anomalies based on method
                anomalies = []
                if method == "statistical" or method == "zscore":
                    # Z-score based detection
                    if std_val > 0:
                        for item in values:
                            z_score = abs((item["value"] - mean_val) / std_val)
                            if z_score > threshold_std:
                                anomalies.append({
                                    **item,
                                    "z_score": z_score,
                                    "severity": "high" if z_score > threshold_std * 1.5 else "medium"
                                })
                
                elif method == "iqr":
                    # IQR-based detection
                    sorted_values = sorted(numeric_values)
                    q1 = sorted_values[int(len(sorted_values) * 0.25)]
                    q3 = sorted_values[int(len(sorted_values) * 0.75)]
                    iqr = q3 - q1
                    lower_bound = q1 - 1.5 * iqr
                    upper_bound = q3 + 1.5 * iqr
                    
                    for item in values:
                        if item["value"] < lower_bound or item["value"] > upper_bound:
                            anomalies.append({
                                **item,
                                "severity": "high" if item["value"] < lower_bound * 0.5 or item["value"] > upper_bound * 1.5 else "medium"
                            })
                
                return {
                    "model_name": model_name,
                    "metric": metric,
                    "method": method,
                    "anomalies": anomalies,
                    "statistics": {
                        "mean": mean_val,
                        "std_dev": std_val,
                        "median": median_val,
                        "min": min(numeric_values),
                        "max": max(numeric_values),
                        "count": len(numeric_values)
                    },
                    "anomaly_count": len(anomalies),
                    "total_points": len(values),
                    "threshold_std": threshold_std,
                    "period_hours": hours,
                    "detected_at": datetime.utcnow().isoformat()
                }
        except Exception as e:
            logger.error(f"Anomaly detection failed: {e}")
            raise
    
    @staticmethod
    async def detect_performance_drift(
        model_name: str,
        metric: str = "latency_ms",
        window_hours: int = 1,
        baseline_hours: int = 24,
        drift_threshold: float = 0.2
    ) -> Dict[str, Any]:
        """
        Detect performance drift compared to historical baseline.
        
        Args:
            model_name: Name of the model
            metric: Metric to analyze
            window_hours: Recent window to analyze
            baseline_hours: Historical baseline period
            drift_threshold: Percentage change threshold for drift
        
        Returns:
            Dictionary with drift detection results
        """
        try:
            db = get_db()
            async with db as session:
                now = datetime.utcnow()
                window_cutoff = now - timedelta(hours=window_hours)
                baseline_cutoff = now - timedelta(hours=window_hours + baseline_hours)
                
                # Get recent window data
                window_query = select(InferenceRun).where(
                    InferenceRun.model_name == model_name,
                    InferenceRun.created_at >= window_cutoff,
                    InferenceRun.status == "completed"
                )
                
                # Get baseline data
                baseline_query = select(InferenceRun).where(
                    InferenceRun.model_name == model_name,
                    InferenceRun.created_at >= baseline_cutoff,
                    InferenceRun.created_at < window_cutoff,
                    InferenceRun.status == "completed"
                )
                
                window_result = await session.execute(window_query)
                window_runs = window_result.scalars().all()
                
                baseline_result = await session.execute(baseline_query)
                baseline_runs = baseline_result.scalars().all()
                
                if not window_runs or not baseline_runs:
                    return {
                        "model_name": model_name,
                        "metric": metric,
                        "drift_detected": False,
                        "reason": "insufficient_data"
                    }
                
                # Calculate averages
                window_values = [getattr(r, metric, 0) for r in window_runs if getattr(r, metric, None) is not None]
                baseline_values = [getattr(r, metric, 0) for r in baseline_runs if getattr(r, metric, None) is not None]
                
                if not window_values or not baseline_values:
                    return {
                        "model_name": model_name,
                        "metric": metric,
                        "drift_detected": False,
                        "reason": "no_metric_values"
                    }
                
                window_avg = statistics.mean(window_values)
                baseline_avg = statistics.mean(baseline_values)
                
                # Calculate drift percentage
                if baseline_avg > 0:
                    drift_percent = abs((window_avg - baseline_avg) / baseline_avg)
                else:
                    drift_percent = 0
                
                drift_detected = drift_percent > drift_threshold
                
                return {
                    "model_name": model_name,
                    "metric": metric,
                    "drift_detected": drift_detected,
                    "drift_percent": drift_percent,
                    "threshold": drift_threshold,
                    "window_avg": window_avg,
                    "baseline_avg": baseline_avg,
                    "window_count": len(window_runs),
                    "baseline_count": len(baseline_runs),
                    "window_hours": window_hours,
                    "baseline_hours": baseline_hours,
                    "detected_at": datetime.utcnow().isoformat()
                }
        except Exception as e:
            logger.error(f"Performance drift detection failed: {e}")
            raise
    
    @staticmethod
    async def get_anomaly_summary(
        models: Optional[List[str]] = None,
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Get anomaly summary across multiple models and metrics.
        
        Args:
            models: List of models to analyze (all if None)
            hours: Time period to analyze
        
        Returns:
            Summary of anomalies across all models
        """
        try:
            db = get_db()
            async with db as session:
                cutoff = datetime.utcnow() - timedelta(hours=hours)
                
                # Get all models if not specified
                if not models:
                    query = select(InferenceRun.model_name).distinct()
                    result = await session.execute(query)
                    models = [row[0] for row in result]
                
                metrics = ["latency_ms", "cost_usd", "hallucination_score"]
                summary = {}
                
                for model in models:
                    model_summary = {
                        "total_anomalies": 0,
                        "by_metric": {}
                    }
                    
                    for metric in metrics:
                        try:
                            anomalies = await AnomalyDetector.detect_anomalies(
                                model_name=model,
                                metric=metric,
                                hours=hours,
                                method="statistical",
                                threshold_std=2.5
                            )
                            
                            model_summary["by_metric"][metric] = {
                                "anomaly_count": anomalies["anomaly_count"],
                                "total_points": anomalies["total_points"],
                                "anomaly_rate": anomalies["anomaly_count"] / anomalies["total_points"] if anomalies["total_points"] > 0 else 0
                            }
                            
                            model_summary["total_anomalies"] += anomalies["anomaly_count"]
                        except Exception as e:
                            logger.warning(f"Failed to detect anomalies for {model} {metric}: {e}")
                    
                    summary[model] = model_summary
                
                # Calculate overall summary
                total_anomalies = sum(s["total_anomalies"] for s in summary.values())
                
                return {
                    "models": summary,
                    "total_anomalies": total_anomalies,
                    "period_hours": hours,
                    "generated_at": datetime.utcnow().isoformat()
                }
        except Exception as e:
            logger.error(f"Anomaly summary failed: {e}")
            raise
