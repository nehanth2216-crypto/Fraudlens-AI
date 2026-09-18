"""FraudPrediction model — ML model predictions."""

from datetime import datetime
from sqlalchemy import Column, Integer, Float, Boolean, DateTime, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class FraudPrediction(Base):
    __tablename__ = "fraud_predictions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), unique=True, nullable=False, index=True)
    model_version = Column(String(50), nullable=True)
    fraud_probability = Column(Float, nullable=False)
    fraud_prediction = Column(Boolean, default=False)
    anomaly_score = Column(Float, default=0.0)
    prediction_time = Column(Float, nullable=True)  # milliseconds

    # Relationships
    transaction = relationship("Transaction", back_populates="prediction")
