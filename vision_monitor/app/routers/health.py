import logging
import time
import asyncio
import redis.asyncio as redis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.schemas.health import HealthResponse, ServiceHealth
from app.config import settings
from influxdb_client import InfluxDBClient
from minio import Minio
from minio.error import S3Error
from pinecone import Pinecone
import httpx

router = APIRouter(prefix="/api/v1/health", tags=["health"])
logger = logging.getLogger(__name__)

# Track start time for uptime calculation
start_time = time.time()


async def check_postgres() -> str:
    """Check PostgreSQL health."""
    try:
        from app.database import engine
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
        return "ok"
    except Exception as e:
        logger.warning(f"PostgreSQL health check failed: {e}")
        return "error"


async def check_redis() -> str:
    """Check Redis health."""
    try:
        r = redis.from_url(settings.REDIS_URL)
        await r.ping()
        return "ok"
    except Exception as e:
        logger.warning(f"Redis health check failed: {e}")
        return "error"


async def check_influxdb() -> str:
    """Check InfluxDB health."""
    try:
        client = InfluxDBClient(
            url=settings.INFLUXDB_URL,
            token=settings.INFLUXDB_TOKEN,
            org=settings.INFLUXDB_ORG
        )
        client.health()
        return "ok"
    except Exception as e:
        logger.warning(f"InfluxDB health check failed: {e}")
        return "error"


async def check_minio() -> str:
    """Check MinIO health."""
    try:
        client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=False
        )
        client.list_buckets()
        return "ok"
    except S3Error as e:
        logger.warning(f"MinIO health check failed: {e}")
        return "error"


async def check_pinecone() -> str:
    """Check Pinecone health."""
    try:
        pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        pc.list_indexes()
        return "ok"
    except Exception as e:
        logger.warning(f"Pinecone health check failed: {e}")
        return "error"


async def check_langfuse() -> str:
    """Check Langfuse health."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.LANGFUSE_HOST}/api/public/health",
                headers={
                    "Authorization": f"Bearer {settings.LANGFUSE_PUBLIC_KEY}:{settings.LANGFUSE_SECRET_KEY}"
                }
            )
            if response.status_code == 200:
                return "ok"
            return "error"
    except Exception as e:
        logger.warning(f"Langfuse health check failed: {e}")
        return "error"


async def check_celery_workers() -> int:
    """Check number of active Celery workers."""
    try:
        from app.workers.tasks import celery_app
        inspect = celery_app.control.inspect()
        stats = inspect.stats()
        if stats:
            return len(stats)
        return 0
    except Exception as e:
        logger.warning(f"Celery health check failed: {e}")
        return 0


async def get_health_status() -> dict:
    """Get health status of all services."""
    postgres_status, redis_status, influxdb_status = await asyncio.gather(
        check_postgres(),
        check_redis(),
        check_influxdb()
    )
    
    minio_status, pinecone_status, langfuse_status, celery_count = await asyncio.gather(
        check_minio(),
        check_pinecone(),
        check_langfuse(),
        check_celery_workers()
    )
    
    services = ServiceHealth(
        postgres=postgres_status,
        influxdb=influxdb_status,
        redis=redis_status,
        minio=minio_status,
        pinecone=pinecone_status,
        langfuse=langfuse_status,
        celery_workers=celery_count
    )
    
    overall_status = "healthy" if all(
        s == "ok" for s in [
            postgres_status, redis_status, influxdb_status,
            minio_status, pinecone_status, langfuse_status
        ]
    ) else "degraded"
    
    return {
        "status": overall_status,
        "services": services,
        "uptime_seconds": time.time() - start_time
    }


@router.get("", response_model=HealthResponse)
async def get_health():
    """
    Get health status of all services.
    Checks PostgreSQL, Redis, InfluxDB, MinIO, Pinecone, Langfuse, and Celery workers.
    """
    health_data = await get_health_status()
    return HealthResponse(**health_data)


@router.websocket("/stream")
async def health_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time health status updates.
    Pushes health status every 5 seconds.
    """
    await websocket.accept()
    
    try:
        while True:
            health_data = await get_health_status()
            await websocket.send_json(health_data)
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        logger.info("Health stream disconnected")
    except Exception as e:
        logger.error(f"Health stream error: {e}")
        await websocket.close()
