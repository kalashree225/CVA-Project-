from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # Redis
    REDIS_URL: str
    
    # Security
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    
    # CORS — comma-separated list of allowed origins
    CORS_ORIGINS: str = "http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
    
    # InfluxDB
    INFLUXDB_URL: str
    INFLUXDB_TOKEN: str
    INFLUXDB_ORG: str
    INFLUXDB_BUCKET: str
    
    # MinIO
    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_BUCKET: str
    
    # Pinecone
    PINECONE_API_KEY: str
    PINECONE_INDEX: str
    PINECONE_DIMENSION: int = 512
    
    # Langfuse
    LANGFUSE_PUBLIC_KEY: str
    LANGFUSE_SECRET_KEY: str
    LANGFUSE_HOST: str
    
    # API Keys
    VALID_API_KEYS: str = ""
    
    # Rate Limiting
    RATE_LIMIT_INFERENCE: int = 20
    RATE_LIMIT_DEFAULT: int = 100
    
    # Celery
    CELERY_BROKER_URL: str = ""
    CELERY_RESULT_BACKEND: str = ""
    
    @property
    def valid_api_keys_list(self) -> List[str]:
        return [key.strip() for key in self.VALID_API_KEYS.split(",") if key.strip()]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Set Celery URLs from Redis URL
settings.CELERY_BROKER_URL = settings.REDIS_URL
settings.CELERY_RESULT_BACKEND = settings.REDIS_URL
