import json
import logging
import redis
from datetime import datetime
from celery import Celery
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings
from app.services.eval_service import EvalService
from app.services.metric_service import MetricService
from app.services.alert_service import AlertService
from app.models.run import InferenceRun
from sqlalchemy import select
import uuid

# Configure Celery
celery_app = Celery(
    "vision_monitor",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
)

# Create async engine for worker
engine = create_async_engine(settings.DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

logger = logging.getLogger(__name__)


def _publish_metric_event(run: InferenceRun, eval_result: dict) -> None:
    """Publish a MetricEvent to Redis pub/sub after a successful evaluation.

    Failures are logged at WARNING level and never re-raised so that the
    evaluation result is never lost due to a Redis connectivity issue.
    """
    try:
        r = redis.Redis.from_url(settings.REDIS_URL)
        event = {
            "event_type": "metric_update",
            "project_id": str(run.organization_id) if run.organization_id else "",
            "run_id": str(run.id),
            "model_name": run.model_name,
            "latency_ms": run.latency_ms,
            "token_count_input": run.token_count_input,
            "token_count_output": run.token_count_output,
            "cost_usd": run.cost_usd,
            "hallucination_score": eval_result.get("hallucination_score") if eval_result else None,
            "status": run.status.value if hasattr(run.status, "value") else str(run.status),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        r.publish(f"metrics:{run.organization_id}", json.dumps(event))
    except Exception as exc:
        logger.warning(f"Failed to publish MetricEvent for run {run.id}: {exc}")


@celery_app.task(name="app.workers.tasks.evaluate_run")
def evaluate_run_task(run_id: str):
    """Celery task to evaluate a run asynchronously."""
    import asyncio
    
    async def _evaluate():
        async with AsyncSessionLocal() as db:
            try:
                # Get the run
                result = await db.execute(select(InferenceRun).where(InferenceRun.id == uuid.UUID(run_id)))
                run = result.scalar_one_or_none()
                
                if not run:
                    logger.warning(f"Run {run_id} not found")
                    return
                
                # Run evaluation
                eval_result = await EvalService.evaluate_run(db, uuid.UUID(run_id))
                
                # Write hallucination score to InfluxDB
                if eval_result.get("hallucination_score"):
                    MetricService.write_hallucination_score(
                        model_name=run.model_name,
                        input_type=run.input_type.value,
                        hallucination_score=eval_result["hallucination_score"]
                    )
                
                # Check alert rules
                await AlertService.check_alerts(
                    db,
                    uuid.UUID(run_id),
                    eval_result.get("hallucination_score", 0),
                    run.latency_ms
                )
                
                # Publish MetricEvent to Redis pub/sub for SSE streaming
                _publish_metric_event(run, eval_result)
                
                logger.info(f"Completed evaluation for run {run_id}")
            except Exception as e:
                logger.error(f"Evaluation task failed for run {run_id}: {e}")
                raise
    
    asyncio.run(_evaluate())


@celery_app.task(name="app.workers.tasks.process_media_upload")
def process_media_upload_task(media_id: str):
    """Celery task to process media upload (generate embedding)."""
    import asyncio
    
    async def _process():
        from app.services.vector_service import VectorService
        from app.models.media import MediaLog
        from sqlalchemy import select
        from app.models.run import InferenceRun
        
        async with AsyncSessionLocal() as db:
            try:
                # Get media log
                result = await db.execute(select(MediaLog).where(MediaLog.id == uuid.UUID(media_id)))
                media = result.scalar_one_or_none()
                
                if not media:
                    logger.warning(f"Media {media_id} not found")
                    return
                
                # Get associated run
                result = await db.execute(select(InferenceRun).where(InferenceRun.id == media.run_id))
                run = result.scalar_one_or_none()
                
                if not run:
                    return
                
                # Generate and upsert embedding if it's an image
                if media.media_type.value == "image":
                    await VectorService.upsert_embedding(
                        run_id=run.id,
                        model_name=run.model_name,
                        input_type=run.input_type.value,
                        metadata={"media_id": str(media.id)}
                    )
                
                logger.info(f"Processed media upload {media_id}")
            except Exception as e:
                logger.error(f"Media processing failed for {media_id}: {e}")
                raise
    
    asyncio.run(_process())
