from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.run import InputType, RunStatus


class InferenceRequest(BaseModel):
    model: str = Field(..., description="Model name (e.g., llava-1.5, gpt-4o)")
    input_type: InputType = Field(..., description="Input type: text, image, or multimodal")
    text: Optional[str] = Field(None, description="Input text")
    image_url: Optional[str] = Field(None, description="Image URL (optional)")


class InferenceResponse(BaseModel):
    run_id: UUID
    status: RunStatus
    trace_id: Optional[str] = None


class InferenceRunResponse(BaseModel):
    id: UUID
    model_name: str
    input_type: InputType
    input_text: Optional[str]
    input_image_url: Optional[str]
    output_text: str
    latency_ms: int
    token_count_input: int
    token_count_output: int
    cost_usd: float
    trace_id: Optional[str]
    hallucination_score: Optional[float]
    status: RunStatus
    created_at: datetime
    
    class Config:
        from_attributes = True


class RunListFilters(BaseModel):
    model: Optional[str] = None
    input_type: Optional[InputType] = None
    status: Optional[RunStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    min_hallucination: Optional[float] = None
