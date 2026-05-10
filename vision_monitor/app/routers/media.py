import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_db
from app.schemas.media import MediaUploadResponse, MediaLogResponse
from app.services.media_service import MediaService
from app.services.vector_service import VectorService
from app.workers.tasks import process_media_upload_task
from app.models.run import InferenceRun
from sqlalchemy import select

router = APIRouter(prefix="/api/v1/media", tags=["media"])
logger = logging.getLogger(__name__)


@router.post("/upload", response_model=MediaUploadResponse)
async def upload_media(
    file: UploadFile = File(...),
    run_id: Optional[uuid.UUID] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a media file (image, audio, video, PDF) to MinIO.
    Returns a presigned URL valid for 1 hour.
    """
    # Read file data
    file_data = await file.read()
    
    # If run_id not provided, create a dummy run for media-only upload
    if run_id is None:
        run_id = uuid.uuid4()
    else:
        # Verify run exists
        result = await db.execute(select(InferenceRun).where(InferenceRun.id == run_id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Run not found")
    
    # Upload to MinIO
    media_log = await MediaService.upload_file(
        file_data=file_data,
        filename=file.filename or "upload",
        content_type=file.content_type or "application/octet-stream",
        run_id=run_id
    )
    
    # Save to database
    db.add(media_log)
    await db.commit()
    await db.refresh(media_log)
    
    # Generate presigned URL
    presigned_url = MediaService.get_presigned_url(media_log.object_key)
    
    # If image, trigger async embedding generation
    if file.content_type and file.content_type.startswith("image/"):
        process_media_upload_task.delay(str(media_log.id))
    
    return MediaUploadResponse(
        media_id=media_log.id,
        presigned_url=presigned_url,
        expires_in=3600
    )


@router.get("/{media_id}/url")
async def get_media_url(
    media_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a fresh presigned URL for a media file.
    """
    media = await MediaService.get_media_by_id(db, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    presigned_url = MediaService.get_presigned_url(media.object_key)
    
    return {"media_id": str(media_id), "presigned_url": presigned_url, "expires_in": 3600}
