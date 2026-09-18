"""FraudAlert model — alerts generated from fraud detection."""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class AlertType(str, enum.Enum):
    HIGH_RISK_TRANSACTION = "HIGH_RISK_TRANSACTION"
    ANOMALY_DETECTED = "ANOMALY_DETECTED"
    RULE_VIOLATION = "RULE_VIOLATION"
    SUSPICIOUS_PATTERN = "SUSPICIOUS_PATTERN"
    NETWORK_ALERT = "NETWORK_ALERT"


class AlertSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AlertStatus(str, enum.Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"


class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False, index=True)
    alert_type = Column(Enum(AlertType), nullable=False)
    severity = Column(Enum(AlertSeverity), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(AlertStatus), default=AlertStatus.OPEN, nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    transaction = relationship("Transaction", back_populates="alerts")
    assignee = relationship("User", foreign_keys=[assigned_to])
    investigations = relationship("Investigation", back_populates="alert")
