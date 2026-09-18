"""Notification model — user notifications for fraud alerts."""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, DateTime, Boolean, ForeignKey
from app.database import Base


class NotificationType(str, enum.Enum):
    ALERT = "ALERT"
    INVESTIGATION = "INVESTIGATION"
    SYSTEM = "SYSTEM"
    INFO = "INFO"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    alert_id = Column(Integer, ForeignKey("fraud_alerts.id"), nullable=True)
    message = Column(String(500), nullable=False)
    type = Column(Enum(NotificationType), default=NotificationType.ALERT)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
