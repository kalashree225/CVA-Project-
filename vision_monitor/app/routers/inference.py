import uuid
import logging
import redis
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.database import get_db
from app.schemas.inference import InferenceRequest, InferenceResponse, InferenceRunResponse, RunListFilters
from app.services.inference_service import InferenceService
from app.services.trace_service import TraceService
from app.services.metric_service import MetricService
from app.services.auth_service import AuthService
from app.models.user import User
from app.workers.tasks import evaluate_run_task
from app.models.run import InputType, RunStatus
from app.config import settings

router = APIRouter(prefix="/api/v1/inference", tags=["inference"])
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def redis_available() -> bool:
    try:
        client = redis.Redis.from_url(settings.REDIS_URL, socket_connect_timeout=0.1, socket_timeout=0.1)
        return bool(client.ping())
    except Exception:
        return False


async def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Return the authenticated User if a valid JWT is present, otherwise None."""
    if not token:
        return None
    payload = AuthService.decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    user = await get_optional_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


@router.post("/run", response_model=InferenceResponse)
async def run_inference(
    request: InferenceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Run multimodal inference (text, image, or both).
    Simulates model inference and triggers async evaluation.
    """
    # Log trace to Langfuse
    trace_id = await TraceService.log_inference_trace(
        model_name=request.model,
        input_text=request.text,
        input_image_url=request.image_url,
        latency_ms=0,  # Will be updated after inference
        token_count_input=0,
        token_count_output=0
    )
    
    # Resolve organization_id from the authenticated user (if any)
    organization_id = current_user.organization_id if current_user else None
    
    # Create inference run
    run = await InferenceService.create_inference_run(db, request, trace_id, organization_id=organization_id)
    
    # Write initial metric to InfluxDB
    MetricService.write_inference_metric(
        model_name=run.model_name,
        input_type=run.input_type.value,
        latency_ms=run.latency_ms,
        token_count_input=run.token_count_input,
        token_count_output=run.token_count_output,
        cost_usd=run.cost_usd,
        hallucination_score=None
    )
    
    # Trigger async evaluation task only when Redis/Celery is actually available.
    if redis_available():
        evaluate_run_task.delay(str(run.id))
    else:
        logger.info("Redis unavailable; persisted inference run without external Celery dispatch.")
    
    return InferenceResponse(
        run_id=run.id,
        status=run.status,
        trace_id=run.trace_id
    )


@router.get("/runs", response_model=List[InferenceRunResponse])
async def list_runs(
    model: Optional[str] = None,
    input_type: Optional[InputType] = None,
    status: Optional[RunStatus] = None,
    min_hallucination: Optional[float] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List inference runs with pagination and filters.
    """
    offset = (page - 1) * page_size
    runs = await InferenceService.list_runs(
        db,
        model=model,
        input_type=input_type,
        status=status,
        min_hallucination=min_hallucination,
        limit=page_size,
        offset=offset
    )
    return runs


@router.get("/runs/{run_id}", response_model=InferenceRunResponse)
async def get_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get full details of a single inference run.
    """
    run = await InferenceService.get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run
