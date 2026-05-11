from sqlalchemy import Column, String, Integer, Float, Text, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base
import enum

class InputType(str, enum.Enum):
    TEXT = "text"
    IMAGE = "image"
    MULTIMODAL = "multimodal"

class RunStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"

class InferenceRun(Base):
    __tablename__ = "inference_runs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    model_name = Column(String(100), nullable=False, index=True)
    input_type = Column(Enum(InputType), nullable=False, index=True)
    input_text = Column(Text, nullable=True)
    input_image_url = Column(Text, nullable=True)
    output_text = Column(Text, nullable=False)
    latency_ms = Column(Integer, nullable=False)
    token_count_input = Column(Integer, nullable=False)
    token_count_output = Column(Integer, nullable=False)
    cost_usd = Column(Float, nullable=False)
    trace_id = Column(String(200), nullable=True, unique=True, index=True)
    organization_id = Column(String(36), nullable=True, index=True)
    hallucination_score = Column(Float, nullable=True)
    status = Column(Enum(RunStatus), nullable=False, default=RunStatus.PENDING, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    evaluations = relationship("EvaluationResult", back_populates="run", cascade="all, delete-orphan")
    media_logs = relationship("MediaLog", back_populates="run", cascade="all, delete-orphan")
