import logging
from datetime import datetime, timedelta
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from sqlalchemy import select, func, and_
from app.config import settings
from app.database import AsyncSessionLocal
from app.models.run import InferenceRun
from typing import Optional, List, Dict

logger = logging.getLogger(__name__)


class MetricService:
    """Service for InfluxDB time-series metrics."""
    
    @staticmethod
    def get_influx_client() -> InfluxDBClient:
        """Get InfluxDB client."""
        return InfluxDBClient(
            url=settings.INFLUXDB_URL,
            token=settings.INFLUXDB_TOKEN,
            org=settings.INFLUXDB_ORG
        )
    
    @staticmethod
    def write_inference_metric(
        model_name: str,
        input_type: str,
        latency_ms: int,
        token_count_input: int,
        token_count_output: int,
        cost_usd: float,
        hallucination_score: Optional[float]
    ):
        """Write inference metric to InfluxDB."""
        if not settings.INFLUXDB_URL:
            return
        try:
            client = MetricService.get_influx_client()
            write_api = client.write_api(write_options=SYNCHRONOUS)
            
            point = Point("inference_metrics") \
                .tag("model_name", model_name) \
                .tag("input_type", input_type) \
                .field("latency_ms", latency_ms) \
                .field("token_count_input", token_count_input) \
                .field("token_count_output", token_count_output) \
                .field("cost_usd", cost_usd)
            
            if hallucination_score is not None:
                point = point.field("hallucination_score", hallucination_score)
            
            write_api.write(bucket=settings.INFLUXDB_BUCKET, record=point)
            logger.debug(f"Wrote metric for model {model_name}")
        except Exception as e:
            logger.warning(f"InfluxDB write failed: {e}")
    
    @staticmethod
    def write_hallucination_score(
        model_name: str,
        input_type: str,
        hallucination_score: float
    ):
        """Write hallucination score to InfluxDB."""
        if not settings.INFLUXDB_URL:
            return
        try:
            client = MetricService.get_influx_client()
            write_api = client.write_api(write_options=SYNCHRONOUS)
            
            point = Point("hallucination_scores") \
                .tag("model_name", model_name) \
                .tag("input_type", input_type) \
                .field("score", hallucination_score)
            
            write_api.write(bucket=settings.INFLUXDB_BUCKET, record=point)
            logger.debug(f"Wrote hallucination score: {hallucination_score}")
        except Exception as e:
            logger.warning(f"InfluxDB hallucination write failed: {e}")
    
    @staticmethod
    async def get_metrics_summary(hours: int = 24) -> dict:
        """Get metrics summary for last N hours (Query database if InfluxDB missing)."""
        if not settings.INFLUXDB_URL:
            try:
                async with AsyncSessionLocal() as db:
                    start_time = datetime.utcnow() - timedelta(hours=hours)
                    
                    # Query aggregations
                    stmt = select(
                        func.count(InferenceRun.id).label("total_requests"),
                        func.avg(InferenceRun.latency_ms).label("avg_latency"),
                        func.sum(InferenceRun.cost_usd).label("total_cost"),
                        func.avg(InferenceRun.hallucination_score).label("avg_hallucination"),
                        func.sum(InferenceRun.token_count_input + InferenceRun.token_count_output).label("total_tokens")
                    ).where(InferenceRun.created_at >= start_time)
                    
                    result_proxy = await db.execute(stmt)
                    result = result_proxy.first()
                    
                    # Query per-model latency
                    model_stmt = select(
                        InferenceRun.model_name,
                        func.avg(InferenceRun.latency_ms)
                    ).where(InferenceRun.created_at >= start_time).group_by(InferenceRun.model_name)
                    
                    model_results_proxy = await db.execute(model_stmt)
                    model_results = model_results_proxy.all()
                    avg_latency_per_model = {row[0]: float(row[1]) for row in model_results}
                    
                    return {
                        "avg_latency_per_model": avg_latency_per_model,
                        "total_token_usage": int(result.total_tokens or 0),
                        "total_estimated_cost": float(result.total_cost or 0),
                        "total_cost_usd": float(result.total_cost or 0),
                        "avg_latency_ms": float(result.avg_latency or 0),
                        "avg_hallucination_score": float(result.avg_hallucination or 0),
                        "total_requests": int(result.total_requests or 0),
                        "period_hours": hours,
                        "status": "persistent"
                    }
            except Exception as e:
                logger.error(f"Database metrics query failed: {e}")
                return {
                    "avg_latency_per_model": {},
                    "total_token_usage": 0,
                    "total_estimated_cost": 0,
                    "total_cost_usd": 0,
                    "avg_latency_ms": 0,
                    "total_requests": 0,
                    "avg_hallucination_score": 0,
                    "period_hours": hours,
                    "status": "error",
                    "message": str(e)
                }
            
        try:
            client = MetricService.get_influx_client()
            # ... (rest of the original code)
            query_api = client.query_api()
            
            start = datetime.utcnow() - timedelta(hours=hours)
            start_str = start.strftime("%Y-%m-%dT%H:%M:%SZ")
            
            # Query avg latency per model
            latency_query = f'''
                from(bucket: "{settings.INFLUXDB_BUCKET}")
                |> range(start: {start_str})
                |> filter(fn: (r) => r["_measurement"] == "inference_metrics")
                |> filter(fn: (r) => r["_field"] == "latency_ms")
                |> group(columns: ["model_name"])
                |> mean()
            '''
            
            # Query total tokens
            token_query = f'''
                from(bucket: "{settings.INFLUXDB_BUCKET}")
                |> range(start: {start_str})
                |> filter(fn: (r) => r["_measurement"] == "inference_metrics")
                |> filter(fn: (r) => r["_field"] == "token_count_input" or r["_field"] == "token_count_output")
                |> sum()
            '''
            
            # Query total cost
            cost_query = f'''
                from(bucket: "{settings.INFLUXDB_BUCKET}")
                |> range(start: {start_str})
                |> filter(fn: (r) => r["_measurement"] == "inference_metrics")
                |> filter(fn: (r) => r["_field"] == "cost_usd")
                |> sum()
            '''
            
            # Query avg hallucination
            hallucination_query = f'''
                from(bucket: "{settings.INFLUXDB_BUCKET}")
                |> range(start: {start_str})
                |> filter(fn: (r) => r["_measurement"] == "hallucination_scores")
                |> filter(fn: (r) => r["_field"] == "score")
                |> mean()
            '''
            
            # Execute queries
            latency_result = query_api.query(latency_query)
            token_result = query_api.query(token_query)
            cost_result = query_api.query(cost_query)
            hallucination_result = query_api.query(hallucination_query)
            
            # Parse results
            avg_latency_per_model = {}
            for table in latency_result:
                for record in table.records:
                    model = record.values.get("model_name", "unknown")
                    value = record.get_value()
                    avg_latency_per_model[model] = value
            
            total_tokens = 0
            for table in token_result:
                for record in table.records:
                    total_tokens += record.get_value() or 0
            
            total_cost = 0
            for table in cost_result:
                for record in table.records:
                    total_cost += record.get_value() or 0
            
            avg_hallucination = 0
            for table in hallucination_result:
                for record in table.records:
                    avg_hallucination = record.get_value() or 0
            
            return {
                "avg_latency_per_model": avg_latency_per_model,
                "total_token_usage": int(total_tokens),
                "total_estimated_cost": round(total_cost, 6),
                "total_cost_usd": round(total_cost, 6),
                "avg_latency_ms": (
                    sum(avg_latency_per_model.values()) / len(avg_latency_per_model)
                    if avg_latency_per_model else 0
                ),
                "total_requests": 0,
                "avg_hallucination_score": round(avg_hallucination, 4),
                "period_hours": hours
            }
        except Exception as e:
            logger.warning(f"InfluxDB summary query failed: {e}")
            return {
                "avg_latency_per_model": {},
                "total_token_usage": 0,
                "total_estimated_cost": 0,
                "total_cost_usd": 0,
                "avg_latency_ms": 0,
                "total_requests": 0,
                "avg_hallucination_score": 0,
                "period_hours": hours,
                "error": str(e)
            }
    
    @staticmethod
    async def get_timeseries(
        metric: str,
        model: str,
        hours: int = 6
    ) -> list[dict]:
        """Get time-series data for a metric (Query database if InfluxDB missing)."""
        if not settings.INFLUXDB_URL:
            try:
                async with AsyncSessionLocal() as db:
                    start_time = datetime.utcnow() - timedelta(hours=hours)
                    
                    # Map metric names to columns
                    column_map = {
                        "latency_ms": InferenceRun.latency_ms,
                        "token_count_input": InferenceRun.token_count_input,
                        "token_count_output": InferenceRun.token_count_output,
                        "cost_usd": InferenceRun.cost_usd,
                        "hallucination_score": InferenceRun.hallucination_score
                    }
                    
                    target_col = column_map.get(metric, InferenceRun.latency_ms)
                    
                    stmt = select(
                        InferenceRun.created_at,
                        target_col
                    ).where(
                        and_(
                            InferenceRun.model_name == model,
                            InferenceRun.created_at >= start_time
                        )
                    ).order_by(InferenceRun.created_at.desc()).limit(100)
                    
                    result_proxy = await db.execute(stmt)
                    results = result_proxy.all()
                    
                    data = [
                        {"timestamp": row[0].isoformat(), "value": float(row[1])}
                        for row in results
                    ]
                    return sorted(data, key=lambda x: x["timestamp"])
            except Exception as e:
                logger.error(f"Database timeseries query failed: {e}")
                return []

        try:
            client = MetricService.get_influx_client()
            # ... (rest of the original code)
            query_api = client.query_api()
            
            start = datetime.utcnow() - timedelta(hours=hours)
            start_str = start.strftime("%Y-%m-%dT%H:%M:%SZ")
            
            query = f'''
                from(bucket: "{settings.INFLUXDB_BUCKET}")
                |> range(start: {start_str})
                |> filter(fn: (r) => r["_measurement"] == "inference_metrics")
                |> filter(fn: (r) => r["_field"] == "{metric}")
                |> filter(fn: (r) => r["model_name"] == "{model}")
            '''
            
            result = query_api.query(query)
            
            data = []
            for table in result:
                for record in table.records:
                    data.append({
                        "timestamp": record.get_time().isoformat(),
                        "value": record.get_value()
                    })
            
            return data
        except Exception as e:
            logger.warning(f"InfluxDB timeseries query failed: {e}")
            return []
