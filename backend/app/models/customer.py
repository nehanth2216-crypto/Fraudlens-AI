"""Customer model — financial customers with risk profiles."""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, DateTime, Date
from sqlalchemy.orm import relationship
from app.database import Base


class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_number = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    account_created_at = Column(DateTime, nullable=True)
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.LOW, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    accounts = relationship("Account", back_populates="customer", lazy="dynamic")
