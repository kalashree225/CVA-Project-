from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base
import enum

class MediaType(str, enum.Enum):
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    DOCUMENT = "document"

class MediaLog(Base):
    __tablename__ = "media_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id = Column(String(36), ForeignKey("inference_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    bucket = Column(String(100), nullable=False)
    object_key = Column(Text, nullable=False)
    media_type = Column(Enum(MediaType), nullable=False)
    size_bytes = Column(BigInteger, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    run = relationship("InferenceRun", back_populates="media_logs")
