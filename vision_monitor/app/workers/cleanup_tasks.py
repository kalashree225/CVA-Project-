import logging
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select, delete
from app.config import settings
from app.models.run import InferenceRun
from app.models.evaluation import EvaluationResult
from app.models.alert import AlertEvent
from app.models.media import MediaLog
from app.models.organization import Organization
import uuid

logger = logging.getLogger(__name__)

# Create async engine for cleanup tasks
engine = create_async_engine(settings.DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class CleanupService:
    """Service for data retention and cleanup tasks."""
    
    @staticmethod
    async def cleanup_old_runs(organization_id: uuid.UUID, retention_days: int):
        """Delete inference runs older than retention period."""
        cutoff = datetime.utcnow() - timedelta(days=retention_days)
        
        async with AsyncSessionLocal() as db:
            try:
                # Delete old runs (cascade will delete related records)
                stmt = delete(InferenceRun).where(
                    InferenceRun.created_at < cutoff,
                    InferenceRun.organization_id == organization_id
                )
                result = await db.execute(stmt)
                await db.commit()
                
                logger.info(f"Deleted {result.rowcount} old runs for organization {organization_id}")
            except Exception as e:
                logger.error(f"Cleanup failed for organization {organization_id}: {e}")
                raise
    
    @staticmethod
    async def cleanup_old_alert_events(days: int = 90):
        """Delete alert events older than specified days."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        async with AsyncSessionLocal() as db:
            try:
                stmt = delete(AlertEvent).where(AlertEvent.triggered_at < cutoff)
                result = await db.execute(stmt)
                await db.commit()
                
                logger.info(f"Deleted {result.rowcount} old alert events")
            except Exception as e:
                logger.error(f"Alert event cleanup failed: {e}")
                raise
    
    @staticmethod
    async def cleanup_orphaned_media():
        """Delete media logs for runs that no longer exist."""
        async with AsyncSessionLocal() as db:
            try:
                # Find media logs where the run doesn't exist
                stmt = delete(MediaLog).where(
                    ~MediaLog.run_id.in_(select(InferenceRun.id))
                )
                result = await db.execute(stmt)
                await db.commit()
                
                logger.info(f"Deleted {result.rowcount} orphaned media logs")
            except Exception as e:
                logger.error(f"Orphaned media cleanup failed: {e}")
                raise
    
    @staticmethod
    async def enforce_data_retention():
        """Enforce data retention policies for all organizations."""
        async with AsyncSessionLocal() as db:
            try:
                # Get all active organizations
                result = await db.execute(select(Organization).where(Organization.is_active == True))
                organizations = result.scalars().all()
                
                for org in organizations:
                    await CleanupService.cleanup_old_runs(org.id, org.data_retention_days)
                
                logger.info(f"Data retention enforcement completed for {len(organizations)} organizations")
            except Exception as e:
                logger.error(f"Data retention enforcement failed: {e}")
                raise


def cleanup_old_runs_task(organization_id: str, retention_days: int):
    """Celery task to cleanup old runs for an organization."""
    import asyncio
    asyncio.run(CleanupService.cleanup_old_runs(uuid.UUID(organization_id), retention_days))


def cleanup_alert_events_task(days: int = 90):
    """Celery task to cleanup old alert events."""
    import asyncio
    asyncio.run(CleanupService.cleanup_old_alert_events(days))


def cleanup_orphaned_media_task():
    """Celery task to cleanup orphaned media logs."""
    import asyncio
    asyncio.run(CleanupService.cleanup_orphaned_media())


def enforce_data_retention_task():
    """Celery task to enforce data retention policies."""
    import asyncio
    asyncio.run(CleanupService.enforce_data_retention())
