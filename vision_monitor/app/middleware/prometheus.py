from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry
import logging

logger = logging.getLogger(__name__)

# Custom metrics
inference_requests_total = Counter(
    'inference_requests_total',
    'Total number of inference requests',
    ['model_name', 'input_type', 'status']
)

inference_latency_seconds = Histogram(
    'inference_latency_seconds',
    'Inference latency in seconds',
    ['model_name', 'input_type']
)

evaluation_requests_total = Counter(
    'evaluation_requests_total',
    'Total number of evaluation requests',
    ['metric_name']
)

hallucination_scores = Histogram(
    'hallucination_scores',
    'Hallucination scores',
    ['model_name']
)

active_users = Gauge(
    'active_users',
    'Number of active users'
)

active_organizations = Gauge(
    'active_organizations',
    'Number of active organizations'
)

alert_events_total = Counter(
    'alert_events_total',
    'Total number of alert events',
    ['rule_name', 'metric']
)

media_uploads_total = Counter(
    'media_uploads_total',
    'Total number of media uploads',
    ['media_type']
)

database_connections = Gauge(
    'database_connections',
    'Number of database connections'
)

redis_operations_total = Counter(
    'redis_operations_total',
    'Total number of Redis operations',
    ['operation', 'status']
)


def setup_prometheus(app):
    """Setup Prometheus metrics for FastAPI app."""
    instrumentator = Instrumentator(
        should_group_status_codes=False,
        should_ignore_untemplated=True,
        should_group_untemplated=True,
        should_instrument_requests_inprogress=True,
        should_instrument_requests_latency=True,
        should_instrument_requests_exceptions=True,
        excluded_handlers=["/metrics", "/health", "/docs", "/openapi.json", "/api/v1/health"],
        env_var_name="ENABLE_METRICS",
        instrumentations=[],
        metric_namespace="vision_monitor",
        metric_subsystem="api"
    )
    
    instrumentator.instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)
    logger.info("Prometheus metrics initialized at /metrics")
    
    return instrumentator
