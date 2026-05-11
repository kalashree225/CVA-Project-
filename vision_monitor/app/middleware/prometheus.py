import logging

logger = logging.getLogger(__name__)

def setup_prometheus(app):
    """Placeholder for Prometheus metrics in Demo Mode."""
    # Prometheus is disabled for the standalone demo to reduce resource overhead.
    logger.info("Prometheus metrics disabled for standalone demo.")
    return None
