from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID


class SimilaritySearchRequest(BaseModel):
    run_id: UUID = Field(..., description="Run ID to find similar runs for")
    top_k: int = Field(5, description="Number of similar results to return")


class SimilaritySearchResult(BaseModel):
    run_id: UUID
    score: float
    model_name: str
    hallucination_score: Optional[float]
    latency_ms: int
    created_at: str


class SimilaritySearchResponse(BaseModel):
    query_run_id: UUID
    results: List[SimilaritySearchResult]
