"""Merchant model — merchants with risk profiling."""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base


class MerchantStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    BLOCKED = "BLOCKED"


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(String(50), unique=True, nullable=False, index=True)
    merchant_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    risk_score = Column(Float, default=0.0)
    status = Column(Enum(MerchantStatus), default=MerchantStatus.ACTIVE)

    # Relationships
    location = relationship("Location")
