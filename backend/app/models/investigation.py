"""Investigation model — fraud investigation workflow."""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class InvestigationPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class InvestigationStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    PENDING_REVIEW = "PENDING_REVIEW"
    CLOSED = "CLOSED"
    ESCALATED = "ESCALATED"


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("fraud_alerts.id"), nullable=False, index=True)
    investigator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    priority = Column(Enum(InvestigationPriority), default=InvestigationPriority.MEDIUM)
    status = Column(Enum(InvestigationStatus), default=InvestigationStatus.OPEN)
    notes = Column(Text, nullable=True)
    resolution = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    # Relationships
    alert = relationship("FraudAlert", back_populates="investigations")
    investigator = relationship("User", foreign_keys=[investigator_id])
