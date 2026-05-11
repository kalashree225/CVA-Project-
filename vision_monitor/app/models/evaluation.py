from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base

class EvaluationResult(Base):
    __tablename__ = "evaluation_results"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id = Column(String(36), ForeignKey("inference_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    metric_name = Column(String(100), nullable=False)
    score = Column(Float, nullable=False)
    explanation = Column(Text, nullable=True)
    evaluated_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    run = relationship("InferenceRun", back_populates="evaluations")
