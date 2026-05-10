import uuid
import logging
from minio import Minio
from minio.error import S3Error
from datetime import timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.media import MediaLog, MediaType
from app.models.run import InferenceRun
from app.config import settings
from typing import Optional

logger = logging.getLogger(__name__)


class MediaService:
    """Service for media upload and MinIO object storage."""
    
    @staticmethod
    def get_minio_client() -> Minio:
        """Get MinIO client."""
        return Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=False
        )
    
    @staticmethod
    async def ensure_bucket_exists():
        """Create bucket if it doesn't exist."""
        try:
            client = MediaService.get_minio_client()
            if not client.bucket_exists(settings.MINIO_BUCKET):
                client.make_bucket(settings.MINIO_BUCKET)
                logger.info(f"Created MinIO bucket: {settings.MINIO_BUCKET}")
        except S3Error as e:
            logger.warning(f"MinIO bucket check failed: {e}")
    
    @staticmethod
    async def upload_file(
        file_data: bytes,
        filename: str,
        content_type: str,
        run_id: uuid.UUID
    ) -> MediaLog:
        """Upload file to MinIO and record in database."""
        client = MediaService.get_minio_client()
        
        # Generate object key
        object_key = f"{run_id}/{filename}"
        
        # Upload to MinIO
        try:
            client.put_object(
                settings.MINIO_BUCKET,
                object_key,
                data=file_data,
                length=len(file_data),
                content_type=content_type
            )
        except S3Error as e:
            logger.error(f"MinIO upload failed: {e}")
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
            bucket=settings.MINIO_BUCKET,
            object_key=object_key,
            media_type=media_type,
            size_bytes=len(file_data)
        )
        
        return media_log
    
    @staticmethod
    def get_presigned_url(object_key: str, expires: int = 3600) -> str:
        """Generate presigned URL for MinIO object."""
        client = MediaService.get_minio_client()
        try:
            url = client.presigned_get_object(
                settings.MINIO_BUCKET,
                object_key,
                expires=timedelta(seconds=expires)
            )
            return url
        except S3Error as e:
            logger.warning(f"Presigned URL generation failed: {e}")
            return ""
    
    @staticmethod
    async def get_media_by_id(db: AsyncSession, media_id: uuid.UUID) -> Optional[MediaLog]:
        """Get media log by ID."""
        result = await db.execute(select(MediaLog).where(MediaLog.id == media_id))
        return result.scalar_one_or_none()
