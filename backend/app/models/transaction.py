"""Transaction model — financial transactions with full metadata."""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class TransactionType(str, enum.Enum):
    TRANSFER = "TRANSFER"
    PAYMENT = "PAYMENT"
    WITHDRAWAL = "WITHDRAWAL"
    DEPOSIT = "DEPOSIT"


class PaymentMethod(str, enum.Enum):
    UPI = "UPI"
    CARD = "CARD"
    NETBANKING = "NETBANKING"
    WALLET = "WALLET"
    ATM = "ATM"


class TransactionStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    HELD = "HELD"
    REVERSED = "REVERSED"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(50), unique=True, nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"), nullable=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="INR")
    transaction_type = Column(Enum(TransactionType), nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    ip_address_id = Column(Integer, ForeignKey("ip_addresses.id"), nullable=True)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.COMPLETED)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    account = relationship("Account", back_populates="transactions")
    beneficiary = relationship("Beneficiary")
    merchant = relationship("Merchant")
    location = relationship("Location")
    device = relationship("Device")
    ip_address = relationship("IPAddress")
    features = relationship("TransactionFeature", back_populates="transaction", uselist=False)
    prediction = relationship("FraudPrediction", back_populates="transaction", uselist=False)
    risk_score = relationship("RiskScore", back_populates="transaction", uselist=False)
    alerts = relationship("FraudAlert", back_populates="transaction")
