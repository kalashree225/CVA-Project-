import uuid
import logging
from fastapi import APIRouter, Depends
from app.schemas.search import SimilaritySearchRequest, SimilaritySearchResponse, SimilaritySearchResult
from app.services.vector_service import VectorService
from app.models.run import InferenceRun
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from sqlalchemy import select
from typing import List
from datetime import datetime

router = APIRouter(prefix="/api/v1/search", tags=["search"])
logger = logging.getLogger(__name__)


@router.post("/similar", response_model=SimilaritySearchResponse)
async def search_similar(
    request: SimilaritySearchRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Find similar past runs using vector similarity search.
    Returns top-k similar runs with their metadata.
    """
    # Query Pinecone for similar runs
    similar_results = await VectorService.query_similar(request.run_id, request.top_k)
    
    # Fetch full run details for each result
    results: List[SimilaritySearchResult] = []
    
    for result in similar_results:
        run_id = uuid.UUID(result["run_id"])
        db_result = await db.execute(select(InferenceRun).where(InferenceRun.id == run_id))
        run = db_result.scalar_one_or_none()
        
        if run:
            results.append(SimilaritySearchResult(
                run_id=run.id,
                score=result["score"],
                model_name=run.model_name,
                hallucination_score=run.hallucination_score,
                latency_ms=run.latency_ms,
                created_at=run.created_at.isoformat()
            ))
    
    return SimilaritySearchResponse(
        query_run_id=request.run_id,
        results=results
    )
