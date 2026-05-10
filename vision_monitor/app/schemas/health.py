from pydantic import BaseModel
from typing import Dict, Any


class ServiceHealth(BaseModel):
    postgres: str
    influxdb: str
    redis: str
    minio: str
    pinecone: str
    langfuse: str
    celery_workers: int


class HealthResponse(BaseModel):
    status: str
    services: ServiceHealth
    uptime_seconds: float
