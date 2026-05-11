from sqlalchemy import Column, String, Float, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base
import enum

class AlertSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertStatus(str, enum.Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"

class AlertOperator(str, enum.Enum):
    GT = "gt"
    LT = "lt"
    EQ = "eq"

class AlertRule(Base):
    __tablename__ = "alert_rules"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    metric = Column(String(100), nullable=False)
    operator = Column(Enum(AlertOperator), nullable=False)
    threshold = Column(Float, nullable=False)
    webhook_url = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    alert_events = relationship("AlertEvent", back_populates="rule", cascade="all, delete-orphan")

class AlertEvent(Base):
    __tablename__ = "alert_events"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rule_id = Column(String(36), ForeignKey("alert_rules.id", ondelete="CASCADE"), nullable=False, index=True)
    triggered_value = Column(Float, nullable=False)
    message = Column(Text, nullable=False)
    notified = Column(Boolean, default=False, nullable=False)
    triggered_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    rule = relationship("AlertRule", back_populates="alert_events")

class Alert(Base):
    """General alert model for system-wide anomalies."""
    __tablename__ = "alerts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.MEDIUM, nullable=False)
    status = Column(Enum(AlertStatus), default=AlertStatus.OPEN, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
