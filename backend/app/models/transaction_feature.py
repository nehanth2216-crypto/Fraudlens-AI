"""TransactionFeature model — ML-generated features for each transaction."""

from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class TransactionFeature(Base):
    __tablename__ = "transaction_features"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), unique=True, nullable=False, index=True)
    amount_deviation = Column(Float, default=0.0)
    velocity_score = Column(Float, default=0.0)
    location_deviation = Column(Float, default=0.0)
    device_change = Column(Float, default=0.0)
    beneficiary_change = Column(Float, default=0.0)
    time_anomaly = Column(Float, default=0.0)
    merchant_frequency = Column(Float, default=0.0)
    account_age_days = Column(Integer, default=0)
    previous_avg_amount = Column(Float, default=0.0)
    transactions_last_hour = Column(Integer, default=0)
    transactions_last_day = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    transaction = relationship("Transaction", back_populates="features")
