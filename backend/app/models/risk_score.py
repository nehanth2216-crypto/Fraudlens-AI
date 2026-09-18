"""RiskScore model — combined risk assessment from all engines."""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RiskDecision(str, enum.Enum):
    APPROVE = "APPROVE"
    VERIFY = "VERIFY"
    REVIEW = "REVIEW"
    HOLD = "HOLD"


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), unique=True, nullable=False, index=True)
    ml_score = Column(Float, default=0.0)
    anomaly_score = Column(Float, default=0.0)
    behavior_score = Column(Float, default=0.0)
    rule_score = Column(Float, default=0.0)
    final_score = Column(Float, default=0.0)
    risk_level = Column(Enum(RiskLevel), nullable=False)
    decision = Column(Enum(RiskDecision), nullable=False)
    reasons = Column(String(2000), nullable=True)  # JSON-encoded list
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    transaction = relationship("Transaction", back_populates="risk_score")
