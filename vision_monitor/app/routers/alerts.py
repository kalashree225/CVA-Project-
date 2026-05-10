import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.schemas.alert import AlertRuleCreate, AlertRuleResponse, AlertEventResponse
from app.services.alert_service import AlertService
from app.models.alert import AlertOperator

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])
logger = logging.getLogger(__name__)


@router.post("/rules", response_model=AlertRuleResponse)
async def create_alert_rule(
    rule: AlertRuleCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new alert rule.
    When the condition is met, a webhook notification will be sent.
    """
    alert_rule = await AlertService.create_rule(
        db,
        name=rule.name,
        metric=rule.metric,
        operator=rule.operator,
        threshold=rule.threshold,
        webhook_url=rule.webhook_url
    )
    return alert_rule


@router.get("/rules", response_model=List[AlertRuleResponse])
async def list_alert_rules(
    db: AsyncSession = Depends(get_db)
):
    """
    List all active alert rules.
    """
    rules = await AlertService.get_active_rules(db)
    return rules


@router.delete("/rules/{rule_id}")
async def delete_alert_rule(
    rule_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an alert rule.
    """
    await AlertService.delete_rule(db, rule_id)
    return {"status": "deleted", "rule_id": str(rule_id)}


@router.get("/events", response_model=List[AlertEventResponse])
async def list_alert_events(
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List recent alert events.
    """
    events = await AlertService.get_recent_events(db, limit)
    return events
