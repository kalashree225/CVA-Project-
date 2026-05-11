from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Database (Defaulting to local SQLite for non-docker deployment)
    DATABASE_URL: str = "sqlite+aiosqlite:///./sentinel.db"
    
    # Storage
    LOCAL_STORAGE_DIR: str = os.path.abspath(os.path.join(os.getcwd(), "sentinel_storage"))
    
    # Security
    JWT_SECRET_KEY: str = "sentinel-intelligence-secret-key-2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
    
    # Sentinel Core Configuration
    HARDWARE_CAMERA_INDEX: int = 0
    SCAN_SENSITIVITY: float = 0.85
    AUTO_MITIGATION_ENABLED: bool = True
    
    # Celery & Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # API Keys
    VALID_API_KEYS: str = "sentinel-api-key"
    
    @property
    def valid_api_keys_list(self) -> List[str]:
        return [key.strip() for key in self.VALID_API_KEYS.split(",") if key.strip()]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Ensure storage directory exists on startup
if not os.path.exists(settings.LOCAL_STORAGE_DIR):
    os.makedirs(settings.LOCAL_STORAGE_DIR)
