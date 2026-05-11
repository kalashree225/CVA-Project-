import uuid
import logging
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_db
from app.schemas.media import MediaUploadResponse, MediaLogResponse
from app.services.media_service import MediaService
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
    Upload a media file (image, audio, video, PDF) to local storage.
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
    
    # Save to Local Storage
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
    
    # Generate serving URL
    presigned_url = MediaService.get_presigned_url(media_log.object_key)
    
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
    Get a fresh serving URL for a media file.
    """
    media = await MediaService.get_media_by_id(db, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    presigned_url = MediaService.get_presigned_url(media.object_key)
    
    return {"media_id": str(media_id), "presigned_url": presigned_url, "expires_in": 3600}

@router.get("/view/{object_key:path}")
async def view_media(object_key: str):
    """Serve a local media file from sentinel_storage."""
    storage_root = MediaService.get_storage_path()
    file_path = os.path.join(storage_root, object_key)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
