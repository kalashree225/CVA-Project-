from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.media import MediaType


class MediaUploadResponse(BaseModel):
    media_id: UUID
    presigned_url: str
    expires_in: int = 3600


class MediaLogResponse(BaseModel):
    id: UUID
    run_id: UUID
    bucket: str
    object_key: str
    media_type: MediaType
    size_bytes: int
    uploaded_at: datetime
    
    class Config:
        from_attributes = True
