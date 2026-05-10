import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, init_db
from app.routers import (
    inference_router,
    metrics_router,
    evaluation_router,
    media_router,
    search_router,
    alerts_router,
    health_router,
    auth_router,
)
from app.analytics.router import router as analytics_router
from app.workflows.router import router as workflows_router
from app.benchmarking.router import router as benchmarking_router
from app.anomaly.router import router as anomaly_router
from app.websocket.router import router as websocket_router
from app.sse.router import router as sse_router
from app.middleware import AuthMiddleware, RateLimitMiddleware, AuditLogMiddleware
from app.middleware.prometheus import setup_prometheus
from app.services.media_service import MediaService
from app.services.vector_service import VectorService

from app.services.automation_service import automation_service

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("Starting Vision + LLM Monitoring System...")
    
    # Start automation service
    try:
        await automation_service.start()
        logger.info("Automation service started")
    except Exception as e:
        logger.error(f"Failed to start automation service: {e}")

    # Initialize database tables (for development)
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.warning(f"Database initialization failed: {e}")
    
    # Ensure MinIO bucket exists
    try:
        await MediaService.ensure_bucket_exists()
        logger.info("MinIO bucket verified")
    except Exception as e:
        logger.warning(f"MinIO bucket verification failed: {e}")
    
    # Ensure Pinecone index exists
    try:
        await VectorService.ensure_index_exists()
        logger.info("Pinecone index verified")
    except Exception as e:
        logger.warning(f"Pinecone index verification failed: {e}")
    
    logger.info("Startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    try:
        await automation_service.stop()
        logger.info("Automation service stopped")
    except Exception as e:
        logger.error(f"Failed to stop automation service: {e}")
    await engine.dispose()
    logger.info("Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Vision + LLM Monitoring System",
    description="Production-ready monitoring system for vision and LLM inference",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
app.add_middleware(AuditLogMiddleware)
app.add_middleware(AuthMiddleware)
app.add_middleware(RateLimitMiddleware)

# Setup Prometheus metrics (Disabled for simple setup)
# setup_prometheus(app)

# Include routers
app.include_router(inference_router)
app.include_router(metrics_router)
app.include_router(evaluation_router)
app.include_router(media_router)
app.include_router(search_router)
app.include_router(alerts_router)
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(analytics_router)
app.include_router(workflows_router)
app.include_router(benchmarking_router)
app.include_router(anomaly_router)
app.include_router(websocket_router)
app.include_router(sse_router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Vision + LLM Monitoring System",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
