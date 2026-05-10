from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class EvaluationResultResponse(BaseModel):
    id: UUID
    run_id: UUID
    metric_name: str
    score: float
    explanation: Optional[str]
    evaluated_at: datetime
    
    class Config:
        from_attributes = True


class EvaluationCreate(BaseModel):
    metric_name: str
    score: float
    explanation: Optional[str] = None
