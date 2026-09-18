"""
FraudLens AI — Database Configuration
SQLAlchemy engine, session factory, and base model.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings


import os

# Robust absolute path to fraudlens.db
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SQLITE_DB_PATH = os.path.join(BASE_DIR, "fraudlens.db")
SQLITE_FALLBACK_URL = f"sqlite:///{SQLITE_DB_PATH}"

try:
    if settings.DATABASE_URL.startswith("sqlite"):
        engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(
            settings.DATABASE_URL,
            echo=settings.DB_ECHO,
            pool_size=20,
            max_overflow=10,
            pool_pre_ping=True,
        )
        # Test connection immediately
        with engine.connect() as conn:
            pass
        print(f" Connected to PostgreSQL database: {settings.DATABASE_URL.split('@')[-1]}")
except Exception as e:
    print(f" PostgreSQL connection failed ({e}). Falling back to local SQLite: {SQLITE_FALLBACK_URL}")
    engine = create_engine(SQLITE_FALLBACK_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """Dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
