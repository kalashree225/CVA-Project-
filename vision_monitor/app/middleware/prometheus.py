import logging
from fastapi import Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

logger = logging.getLogger(__name__)

def setup_prometheus(app):
    """Expose lightweight Prometheus metrics for local and test runs."""

    @app.get("/metrics", include_in_schema=False)
    async def metrics():
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    logger.info("Prometheus metrics endpoint mounted at /metrics.")
    return app
