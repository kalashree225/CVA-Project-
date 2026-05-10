from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.alert import AlertOperator


class AlertRuleCreate(BaseModel):
    name: str = Field(..., description="Alert rule name")
    metric: str = Field(..., description="Metric to monitor (e.g., hallucination_score, latency_ms)")
    operator: AlertOperator = Field(..., description="Comparison operator: gt, lt, eq")
    threshold: float = Field(..., description="Threshold value")
    webhook_url: Optional[str] = Field(None, description="Webhook URL for notifications")


class AlertRuleResponse(BaseModel):
    id: UUID
    name: str
    metric: str
    operator: AlertOperator
    threshold: float
    webhook_url: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class AlertEventResponse(BaseModel):
    id: UUID
    rule_id: UUID
    triggered_value: float
    message: str
    notified: bool
    triggered_at: datetime
    
    class Config:
        from_attributes = True


class AlertWebhookPayload(BaseModel):
    alert: str
    value: float
    threshold: float
    run_id: UUID
    timestamp: str
