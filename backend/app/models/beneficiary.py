"""Beneficiary model — transaction beneficiaries with risk tracking."""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base


class BeneficiaryStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    BLOCKED = "BLOCKED"
    SUSPICIOUS = "SUSPICIOUS"


class Beneficiary(Base):
    __tablename__ = "beneficiaries"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    beneficiary_account_masked = Column(String(20), nullable=False)
    bank = Column(String(100), nullable=True)
    first_added = Column(DateTime, default=datetime.utcnow)
    transaction_count = Column(Integer, default=0)
    risk_score = Column(Float, default=0.0)
    status = Column(Enum(BeneficiaryStatus), default=BeneficiaryStatus.ACTIVE)

    # Relationships
    account = relationship("Account", back_populates="beneficiaries")
