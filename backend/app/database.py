"""
FraudLens AI — Database Configuration
SQLAlchemy engine, session factory, and base model.

On Render:
- Set DATABASE_URL=sqlite:///./fraudlens.db (default below)
- Or set DATABASE_URL=postgresql://... for a managed PostgreSQL add-on
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings


def _build_engine():
    db_url = settings.DATABASE_URL

    # --- PostgreSQL path ---
    if db_url.startswith("postgresql") or db_url.startswith("postgres"):
        try:
            eng = create_engine(
                db_url,
                echo=settings.DB_ECHO,
                pool_size=5,
                max_overflow=10,
                pool_pre_ping=True,
            )
            with eng.connect() as conn:
                pass
            print(f"[OK] Connected to PostgreSQL: {db_url.split('@')[-1]}")
            return eng
        except Exception as e:
            print(f"[WARN] PostgreSQL connection failed ({e}). Falling back to SQLite.")

    # --- SQLite path ---
    # Resolve an absolute path relative to this file so it works regardless
    # of the working directory (local dev vs Render deployment).
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    sqlite_path = os.path.join(BASE_DIR, "fraudlens.db")
    sqlite_url = f"sqlite:///{sqlite_path}"
    print(f"[OK] Using SQLite database: {sqlite_path}")
    return create_engine(sqlite_url, connect_args={"check_same_thread": False})


engine = _build_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def run_migrations(eng=None):
    """Safely apply schema additions to existing SQLite or PostgreSQL database."""
    target_engine = eng or engine
    try:
        with target_engine.connect() as conn:
            from sqlalchemy import text
            # For SQLite
            if "sqlite" in str(target_engine.url):
                # Check fraud_alerts
                cols_res = conn.execute(text("PRAGMA table_info(fraud_alerts)")).fetchall()
                alert_cols = [c[1] for c in cols_res]
                if alert_cols:
                    if "resolution" not in alert_cols:
                        conn.execute(text("ALTER TABLE fraud_alerts ADD COLUMN resolution VARCHAR(100)"))
                    if "notes" not in alert_cols:
                        conn.execute(text("ALTER TABLE fraud_alerts ADD COLUMN notes TEXT"))

                # Check audit_logs
                cols_audit = conn.execute(text("PRAGMA table_info(audit_logs)")).fetchall()
                audit_cols = [c[1] for c in cols_audit]
                if audit_cols:
                    if "user_name" not in audit_cols:
                        conn.execute(text("ALTER TABLE audit_logs ADD COLUMN user_name VARCHAR(255)"))
                    if "ip_address" not in audit_cols:
                        conn.execute(text("ALTER TABLE audit_logs ADD COLUMN ip_address VARCHAR(45)"))
                conn.commit()
    except Exception as e:
        print(f"[WARN] Database migration check: {e}")


# Run migrations
run_migrations(engine)


def get_db():
    """Dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

