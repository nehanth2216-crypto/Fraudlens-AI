"""ModelVersion model — ML model versioning and metrics."""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime
from app.database import Base


class ModelStatus(str, enum.Enum):
    TRAINING = "TRAINING"
    ACTIVE = "ACTIVE"
    DEPRECATED = "DEPRECATED"
    FAILED = "FAILED"


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    model_type = Column(String(50), nullable=False)  # supervised, anomaly, behavioral
    version = Column(String(20), nullable=False)
    precision_score = Column(Float, nullable=True)
    recall_score = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    roc_auc = Column(Float, nullable=True)
    trained_at = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(ModelStatus), default=ModelStatus.ACTIVE)
