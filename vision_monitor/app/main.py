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
    camera_router,
    operations_router,
)
from app.analytics.router import router as analytics_router
from app.workflows.router import router as workflows_router
from app.benchmarking.router import router as benchmarking_router
from app.anomaly.router import router as anomaly_router
from app.websocket.router import router as websocket_router
from app.sse.router import router as sse_router
from app.middleware import AuthMiddleware, RateLimitMiddleware, AuditLogMiddleware
from app.services.media_service import MediaService
from app.services.sentinel_engine import SentinelEngine
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
    logger.info("Starting Sentinel Intelligence Platform...")
    
    # Start automation service
    try:
        await automation_service.start()
    except Exception as e:
        logger.error(f"Failed to start automation service: {e}")

    # Start the Intelligence Engine (Synchronous start)
    try:
        SentinelEngine.get_instance().start()
        logger.info("Sentinel Intelligence Engine initialized.")
    except Exception as e:
        logger.error(f"Failed to start sentinel engine: {e}")

    # Initialize database tables
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.warning(f"Database initialization failed: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Sentinel...")
    SentinelEngine.get_instance().stop()
    try:
        await automation_service.stop()
    except Exception as e:
        logger.error(f"Failed to stop automation service: {e}")
    await engine.dispose()
    logger.info("Shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Sentinel Intelligence Platform",
    description="Real-time CVA monitoring and automated response system",
    version="2.0.0",
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

# Add custom middleware (Optional: skip if causing issues in dev)
app.add_middleware(AuditLogMiddleware)
# app.add_middleware(AuthMiddleware) # Bypass auth for demo
# app.add_middleware(RateLimitMiddleware)

# Include routers
app.include_router(inference_router)
app.include_router(metrics_router)
app.include_router(evaluation_router)
app.include_router(media_router)
app.include_router(search_router)
app.include_router(alerts_router)
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(camera_router, prefix="/api/v1/camera", tags=["camera"])
app.include_router(operations_router, prefix="/api/v1/ops", tags=["operations"])
app.include_router(analytics_router)
app.include_router(workflows_router)
app.include_router(benchmarking_router)
app.include_router(anomaly_router)
app.include_router(websocket_router)
app.include_router(sse_router)

@app.get("/api/v1/intelligence")
async def get_intelligence():
    """Retrieve real-time sentinel intelligence events."""
    return SentinelEngine.get_instance().get_latest_intelligence()

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Sentinel Intelligence Platform",
        "version": "2.0.0",
        "status": "active",
        "real_time_engine": "operational"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
