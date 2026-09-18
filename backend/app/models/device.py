"""Device model — device fingerprinting for fraud detection."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_fingerprint = Column(String(255), unique=True, nullable=False, index=True)
    device_type = Column(String(50), nullable=True)  # mobile, desktop, tablet
    operating_system = Column(String(100), nullable=True)
    browser = Column(String(100), nullable=True)
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    risk_score = Column(Float, default=0.0)
