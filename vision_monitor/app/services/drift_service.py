import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from app.models.run import InferenceRun
import redis.asyncio as redis
from app.config import settings
import json

logger = logging.getLogger(__name__)


class DriftService:
    """Service for data drift detection (Evidently-style lightweight)."""
    
    @staticmethod
    async def get_redis() -> redis.Redis:
        """Get Redis client."""
        return redis.from_url(settings.REDIS_URL, decode_responses=True)
    
    @staticmethod
    def compute_stats(values: list[float]) -> dict:
        """Compute basic statistics."""
        if not values:
            return {"mean": 0, "std": 0, "p95": 0, "count": 0}
        
        n = len(values)
        mean = sum(values) / n
        variance = sum((x - mean) ** 2 for x in values) / n
        std = variance ** 0.5
        sorted_values = sorted(values)
        p95 = sorted_values[int(len(sorted_values) * 0.95)] if sorted_values else 0
        
        return {"mean": mean, "std": std, "p95": p95, "count": n}
    
    @staticmethod
    def detect_trend(values: list[float]) -> str:
        """Detect trend direction from time series."""
        if len(values) < 2:
            return "stable"
        
        first_half = values[:len(values)//2]
        second_half = values[len(values)//2:]
        
        avg_first = sum(first_half) / len(first_half)
        avg_second = sum(second_half) / len(second_half)
        
        if avg_second > avg_first * 1.1:
            return "increasing"
        elif avg_second < avg_first * 0.9:
            return "decreasing"
        else:
            return "stable"
    
    @staticmethod
    async def compute_drift_report(
        db: AsyncSession,
        hours: int = 24
    ) -> dict:
        """Compute drift report for last N hours."""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        
        result = await db.execute(
            select(InferenceRun).where(InferenceRun.created_at >= cutoff)
        )
        runs = result.scalars().all()
        
        if not runs:
            return {
                "period_hours": hours,
                "run_count": 0,
                "metrics": {},
                "drift_detected": False
            }
        
        # Extract metrics
        hallucination_scores = [r.hallucination_score for r in runs if r.hallucination_score is not None]
        latencies = [r.latency_ms for r in runs]
        token_outputs = [r.token_count_output for r in runs]
        
        # Compute stats
        h_stats = DriftService.compute_stats(hallucination_scores)
        l_stats = DriftService.compute_stats(latencies)
        t_stats = DriftService.compute_stats(token_outputs)
        
        # Detect trends
        h_trend = DriftService.detect_trend(hallucination_scores)
        
        # Check for drift (simple threshold-based)
        drift_flags = {
            "hallucination_score": {
                "drift": h_stats["std"] > 0.15 or h_trend == "increasing",
                "trend": h_trend,
                "stats": h_stats
            },
            "latency_ms": {
                "drift": l_stats["std"] > 500,
                "stats": l_stats
            },
            "token_count_output": {
                "drift": t_stats["std"] > 100,
                "stats": t_stats
            }
        }
        
        drift_detected = any(v["drift"] for v in drift_flags.values())
        
        return {
            "period_hours": hours,
            "run_count": len(runs),
            "metrics": drift_flags,
            "drift_detected": drift_detected
        }
    
    @staticmethod
    async def set_baseline(db: AsyncSession, hours: int = 48) -> dict:
        """Compute and store baseline statistics in Redis."""
        report = await DriftService.compute_drift_report(db, hours)
        
        r = await DriftService.get_redis()
        baseline_key = "drift:baseline"
        
        baseline_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "report": report
        }
        
        await r.set(baseline_key, json.dumps(baseline_data), ex=7 * 24 * 60 * 60)  # 7 days TTL
        
        logger.info(f"Drift baseline set for {hours} hours of data")
        return {"status": "baseline_set", "data": report}
    
    @staticmethod
    async def get_baseline() -> Optional[dict]:
        """Retrieve stored baseline from Redis."""
        try:
            r = await DriftService.get_redis()
            baseline_data = await r.get("drift:baseline")
            
            if baseline_data:
                return json.loads(baseline_data)
            return None
        except Exception as e:
            logger.warning(f"Failed to get baseline: {e}")
            return None
