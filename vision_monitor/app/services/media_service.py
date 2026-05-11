import uuid
import logging
import os
import shutil
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.media import MediaLog, MediaType
from app.models.run import InferenceRun
from app.config import settings
from typing import Optional

logger = logging.getLogger(__name__)

class MediaService:
    """Service for media upload using local file storage (Alternative to Docker/MinIO)."""
    
    @staticmethod
    def get_storage_path() -> str:
        """Get the absolute path to the local storage directory."""
        storage_path = os.path.abspath(os.path.join(os.getcwd(), "sentinel_storage"))
        if not os.path.exists(storage_path):
            os.makedirs(storage_path)
            logger.info(f"Created local storage directory: {storage_path}")
        return storage_path
    
    @staticmethod
    async def ensure_bucket_exists():
        """Ensure the local storage directory exists."""
        MediaService.get_storage_path()
    
    @staticmethod
    async def upload_file(
        file_data: bytes,
        filename: str,
        content_type: str,
        run_id: uuid.UUID
    ) -> MediaLog:
        """Save file to local storage and record in database."""
        storage_root = MediaService.get_storage_path()
        
        # Create run-specific directory
        run_dir = os.path.join(storage_root, str(run_id))
        if not os.path.exists(run_dir):
            os.makedirs(run_dir)
            
        # Generate full file path
        file_path = os.path.join(run_dir, filename)
        
        # Save to local disk
        try:
            with open(file_path, "wb") as f:
                f.write(file_data)
        except Exception as e:
            logger.error(f"Local storage write failed: {e}")
            raise
        
        # Determine media type
        media_type = MediaType.IMAGE
        if content_type.startswith("audio/"):
            media_type = MediaType.AUDIO
        elif content_type.startswith("video/"):
            media_type = MediaType.VIDEO
        elif content_type == "application/pdf":
            media_type = MediaType.DOCUMENT
        
        # Create media log record
        media_log = MediaLog(
            id=uuid.uuid4(),
            run_id=run_id,
            bucket="local_storage",
            object_key=os.path.join(str(run_id), filename).replace("\\", "/"),
            media_type=media_type,
            size_bytes=len(file_data)
        )
        
        return media_log
    
    @staticmethod
    def get_presigned_url(object_key: str, expires: int = 3600) -> str:
        """Return a local file path or static URL for the object."""
        # For a simple demo, we serve these via a static route in FastAPI
        return f"/api/v1/media/view/{object_key}"
    
    @staticmethod
    async def get_media_by_id(db: AsyncSession, media_id: uuid.UUID) -> Optional[MediaLog]:
        """Get media log by ID."""
        result = await db.execute(select(MediaLog).where(MediaLog.id == media_id))
        return result.scalar_one_or_none()
