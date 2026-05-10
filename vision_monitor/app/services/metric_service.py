import logging
from datetime import datetime, timedelta
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from app.config import settings
from typing import Optional

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
        """Get metrics summary for last N hours."""
        try:
            client = MetricService.get_influx_client()
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
                "avg_hallucination_score": round(avg_hallucination, 4),
                "period_hours": hours
            }
        except Exception as e:
            logger.warning(f"InfluxDB summary query failed: {e}")
            return {
                "avg_latency_per_model": {},
                "total_token_usage": 0,
                "total_estimated_cost": 0,
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
        """Get time-series data for a metric."""
        try:
            client = MetricService.get_influx_client()
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
