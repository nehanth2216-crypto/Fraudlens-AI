"""Account model — financial accounts linked to customers."""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class AccountType(str, enum.Enum):
    SAVINGS = "SAVINGS"
    CURRENT = "CURRENT"
    SALARY = "SALARY"
    CREDIT = "CREDIT"


class AccountStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    FROZEN = "FROZEN"
    CLOSED = "CLOSED"


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    account_number_masked = Column(String(20), nullable=False)
    account_type = Column(Enum(AccountType), nullable=False)
    bank = Column(String(100), nullable=False)
    balance = Column(Float, default=0.0)
    currency = Column(String(3), default="INR")
    status = Column(Enum(AccountStatus), default=AccountStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", lazy="dynamic")
    beneficiaries = relationship("Beneficiary", back_populates="account", lazy="dynamic")
