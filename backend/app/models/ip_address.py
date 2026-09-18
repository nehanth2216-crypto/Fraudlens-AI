"""IPAddress model — hashed IP tracking for fraud detection."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base


class IPAddress(Base):
    __tablename__ = "ip_addresses"

    id = Column(Integer, primary_key=True, index=True)
    ip_hash = Column(String(255), unique=True, nullable=False, index=True)
    country = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    risk_score = Column(Float, default=0.0)
