import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.schemas.evaluation import EvaluationResultResponse
from app.services.eval_service import EvalService
from app.workers.tasks import evaluate_run_task

router = APIRouter(prefix="/api/v1/evaluation", tags=["evaluation"])
logger = logging.getLogger(__name__)


@router.get("/{run_id}", response_model=List[EvaluationResultResponse])
async def get_evaluation(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all evaluation scores for a specific run.
    """
    evaluations = await EvalService.get_evaluations(db, run_id)
    return evaluations


@router.post("/run/{run_id}")
async def trigger_evaluation(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Manually re-trigger evaluation for a run.
    """
    # Trigger the Celery task
    evaluate_run_task.delay(str(run_id))
    
    return {"status": "evaluation_triggered", "run_id": str(run_id)}
