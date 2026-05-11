import httpx
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.alert import AlertRule, AlertEvent, AlertOperator
from app.models.run import InferenceRun
from app.config import settings
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)


class AlertService:
    """Service for alert rules and webhook notifications."""
    
    @staticmethod
    def evaluate_condition(
        operator: AlertOperator,
        value: float,
        threshold: float
    ) -> bool:
        """Evaluate if alert condition is met."""
        if operator == AlertOperator.GT:
            return value > threshold
        elif operator == AlertOperator.LT:
            return value < threshold
        elif operator == AlertOperator.EQ:
            return value == threshold
        return False
    
    @staticmethod
    async def check_alerts(
        db: AsyncSession,
        run_id: uuid.UUID,
        hallucination_score: float,
        latency_ms: int
    ):
        """Check all active alert rules against run metrics."""
        # Get active alert rules
        result = await db.execute(
            select(AlertRule).where(AlertRule.is_active == True)
        )
        rules = result.scalars().all()
        
        # Prepare metric values
        metrics = {
            "hallucination_score": hallucination_score,
            "latency_ms": latency_ms
        }
        
        for rule in rules:
            metric_value = metrics.get(rule.metric)
            
            if metric_value is None:
                continue
            
            # Check if condition is met
            if AlertService.evaluate_condition(rule.operator, metric_value, rule.threshold):
                await AlertService.trigger_alert(
                    db,
                    rule.id,
                    metric_value,
                    run_id
                )
    
    @staticmethod
    async def trigger_alert(
        db: AsyncSession,
        rule_id: uuid.UUID,
        triggered_value: float,
        run_id: uuid.UUID
    ):
        """Trigger an alert event and send webhook notification."""
        # Get rule
        result = await db.execute(select(AlertRule).where(AlertRule.id == rule_id))
        rule = result.scalar_one_or_none()
        
        if not rule:
            logger.warning(f"Alert rule {rule_id} not found")
            return
        
        # Create alert event
        message = f"Alert '{rule.name}' triggered: {rule.metric} = {triggered_value} {rule.operator} {rule.threshold}"
        
        alert_event = AlertEvent(
            id=str(uuid.uuid4()),
            rule_id=str(rule_id),
            triggered_value=triggered_value,
            message=message,
            notified=False
        )
        
        db.add(alert_event)
        await db.commit()
        
        # Send webhook if configured
        if rule.webhook_url:
            await AlertService.send_webhook(
                rule.webhook_url,
                rule.name,
                triggered_value,
                rule.threshold,
                run_id
            )
            
            # Mark as notified
            alert_event.notified = True
            await db.commit()
        
        logger.info(f"Alert triggered: {message}")
    
    @staticmethod
    async def send_webhook(
        webhook_url: str,
        alert_name: str,
        value: float,
        threshold: float,
        run_id: uuid.UUID
    ):
        """Send webhook notification."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                payload = {
                    "alert": alert_name,
                    "value": value,
                    "threshold": threshold,
                    "run_id": str(run_id),
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                response = await client.post(webhook_url, json=payload)
                
                if response.status_code == 200:
                    logger.info(f"Webhook sent successfully to {webhook_url}")
                else:
                    logger.warning(f"Webhook failed: {response.status_code}")
        except Exception as e:
            logger.warning(f"Webhook send error: {e}")
    
    @staticmethod
    async def create_rule(
        db: AsyncSession,
        name: str,
        metric: str,
        operator: AlertOperator,
        threshold: float,
        webhook_url: str = None
    ) -> AlertRule:
        """Create a new alert rule."""
        rule = AlertRule(
            id=str(uuid.uuid4()),
            name=name,
            metric=metric,
            operator=operator,
            threshold=threshold,
            webhook_url=webhook_url,
            is_active=True
        )
        
        db.add(rule)
        await db.commit()
        await db.refresh(rule)
        
        logger.info(f"Created alert rule: {name}")
        return rule
    
    @staticmethod
    async def get_active_rules(db: AsyncSession) -> list[AlertRule]:
        """Get all active alert rules."""
        result = await db.execute(
            select(AlertRule).where(AlertRule.is_active == True)
        )
        return result.scalars().all()
    
    @staticmethod
    async def delete_rule(db: AsyncSession, rule_id: uuid.UUID):
        """Delete an alert rule."""
        result = await db.execute(select(AlertRule).where(AlertRule.id == rule_id))
        rule = result.scalar_one_or_none()
        
        if rule:
            await db.delete(rule)
            await db.commit()
            logger.info(f"Deleted alert rule {rule_id}")
    
    @staticmethod
    async def get_recent_events(
        db: AsyncSession,
        limit: int = 50
    ) -> list[AlertEvent]:
        """Get recent alert events."""
        result = await db.execute(
            select(AlertEvent)
            .order_by(AlertEvent.triggered_at.desc())
            .limit(limit)
        )
        return result.scalars().all()
