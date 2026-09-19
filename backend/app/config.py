"""
FraudLens AI — Application Configuration
Loads settings from environment variables with sensible defaults.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/fraudlens"
    DB_ECHO: bool = False

    # JWT
    JWT_SECRET: str = "dev-secret-key-fraudlens-2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 480

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Server
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:5173"

    # AI Assistant
    AI_API_KEY: Optional[str] = None

    # Risk Engine Weights
    RISK_WEIGHT_ML: float = 0.35
    RISK_WEIGHT_ANOMALY: float = 0.25
    RISK_WEIGHT_BEHAVIOR: float = 0.25
    RISK_WEIGHT_RULES: float = 0.15

    # Risk Thresholds (Paytm FinTech Spec: 0-30 LOW, 31-70 MEDIUM, 71-100 HIGH)
    RISK_THRESHOLD_LOW: int = 30
    RISK_THRESHOLD_MEDIUM: int = 70
    RISK_THRESHOLD_HIGH: int = 85

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
