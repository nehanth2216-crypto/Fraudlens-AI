"""Fraud network models — graph-based fraud detection."""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey
from app.database import Base


class NetworkType(str, enum.Enum):
    DEVICE_SHARING = "DEVICE_SHARING"
    IP_SHARING = "IP_SHARING"
    BENEFICIARY_RING = "BENEFICIARY_RING"
    TRANSACTION_CHAIN = "TRANSACTION_CHAIN"
    MIXED = "MIXED"


class NetworkStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    CONFIRMED_FRAUD = "CONFIRMED_FRAUD"
    CLEARED = "CLEARED"


class RelationshipType(str, enum.Enum):
    USES_DEVICE = "USES_DEVICE"
    SHARES_IP = "SHARES_IP"
    SENDS_TO = "SENDS_TO"
    RECEIVES_FROM = "RECEIVES_FROM"
    USES_BENEFICIARY = "USES_BENEFICIARY"
    TRANSACTS_WITH = "TRANSACTS_WITH"
    ASSOCIATED_WITH = "ASSOCIATED_WITH"


class FraudNetwork(Base):
    __tablename__ = "fraud_networks"

    id = Column(Integer, primary_key=True, index=True)
    network_name = Column(String(255), nullable=False)
    network_type = Column(Enum(NetworkType), nullable=False)
    risk_score = Column(Float, default=0.0)
    status = Column(Enum(NetworkStatus), default=NetworkStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class NetworkConnection(Base):
    __tablename__ = "network_connections"

    id = Column(Integer, primary_key=True, index=True)
    network_id = Column(Integer, ForeignKey("fraud_networks.id"), nullable=False, index=True)
    source_type = Column(String(50), nullable=False)  # customer, account, device, etc.
    source_id = Column(Integer, nullable=False)
    target_type = Column(String(50), nullable=False)
    target_id = Column(Integer, nullable=False)
    relationship = Column(Enum(RelationshipType), nullable=False)
    weight = Column(Float, default=1.0)
