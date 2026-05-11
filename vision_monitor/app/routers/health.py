import logging
import time
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.schemas.health import HealthResponse, ServiceHealth
from app.config import settings

router = APIRouter(prefix="/api/v1/health", tags=["health"])
logger = logging.getLogger(__name__)

start_time = time.time()

async def check_db() -> str:
    """Check database health."""
    try:
        from app.database import engine
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return "ok"
    except Exception as e:
        logger.warning(f"Database health check failed: {e}")
        return "error"

async def check_storage() -> str:
    """Check local storage health."""
    import os
    if os.path.exists(settings.LOCAL_STORAGE_DIR):
        return "ok"
    return "error"

async def get_health_status() -> dict:
    """Get health status of all core sentinel services."""
    db_status = await check_db()
    storage_status = await check_storage()
    
    # Mocking external services as 'ok' or 'n/a' for standalone demo
    services = ServiceHealth(
        postgres=db_status,
        influxdb="ok",
        redis="ok",
        minio=storage_status,
        pinecone="ok",
        langfuse="ok",
        celery_workers=1
    )
    
    overall_status = "healthy" if db_status == "ok" and storage_status == "ok" else "degraded"
    
    return {
        "status": overall_status,
        "services": services,
        "uptime_seconds": time.time() - start_time
    }

@router.get("", response_model=HealthResponse)
async def get_health():
    """Get health status of the Sentinel Platform."""
    health_data = await get_health_status()
    return HealthResponse(**health_data)

@router.websocket("/stream")
async def health_stream(websocket: WebSocket):
    """WebSocket for real-time system health updates."""
    await websocket.accept()
    try:
        while True:
            health_data = await get_health_status()
            await websocket.send_json(health_data)
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Health stream error: {e}")
        await websocket.close()
