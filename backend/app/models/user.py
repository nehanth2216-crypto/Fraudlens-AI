"""User model — authentication and RBAC."""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, DateTime, Boolean
from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    FRAUD_ANALYST = "FRAUD_ANALYST"
    INVESTIGATOR = "INVESTIGATOR"
    VIEWER = "VIEWER"


class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.VIEWER, nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)
