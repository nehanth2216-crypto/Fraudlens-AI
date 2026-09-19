"""
FraudLens AI — Main Application Entry Point
FastAPI application with CORS, rate limiting, security headers, WebSocket telemetry, and all route mounting.
"""

import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings
from app.database import engine, Base

# Import all models to register them with SQLAlchemy
from app.models import *  # noqa: F401, F403

from app.api.auth import router as auth_router
from app.api.transactions import router as transactions_router
from app.api.fraud import router as fraud_router
from app.api.alerts import router as alerts_router
from app.api.routes import (
    dashboard_router, customers_router, accounts_router,
    investigations_router, networks_router, analytics_router,
    reports_router, assistant_router, data_router, audit_router,
)
from app.api.v2_routes import router as v2_router
from app.websocket_manager import ws_manager
from app.middleware.rate_limiter import SimpleRateLimiterMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    # Create database tables
    Base.metadata.create_all(bind=engine)
    print("[OK] FraudLens AI - Database tables created")

    # Pre-load ML models
    try:
        from ml.supervised_model import load_model as load_supervised
        from ml.anomaly_model import load_model as load_anomaly
        load_supervised()
        load_anomaly()
        print("[OK] FraudLens AI - ML models loaded")
    except Exception as e:
        print(f"[WARN] ML model loading: {e}")

    yield

    # Clean shutdown of streaming tasks if any
    try:
        from app.services.stream_simulator import stop_streaming
        stop_streaming()
    except Exception:
        pass
    print("[INFO] FraudLens AI - Shutting down")


app = FastAPI(
    title="FraudLens AI",
    description="Intelligent Real-Time Financial Fraud Detection & Investigation Platform",
    version="1.0.0",
    lifespan=lifespan,
)


# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(SimpleRateLimiterMiddleware, max_requests_per_minute=180)

# CORS — local dev + Vercel production + Render preview URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "https://fraudlens-ai.vercel.app",
        "https://fraudlens-ai-sable.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(transactions_router)
app.include_router(fraud_router)
app.include_router(alerts_router)
app.include_router(customers_router)
app.include_router(accounts_router)
app.include_router(investigations_router)
app.include_router(networks_router)
app.include_router(analytics_router)
app.include_router(reports_router)
app.include_router(assistant_router)
app.include_router(data_router)
app.include_router(audit_router)
app.include_router(v2_router)


# WebSocket endpoint for real-time telemetry, alerts, and transaction stream
@app.websocket("/ws/alerts")
@app.websocket("/ws/stream")
async def websocket_telemetry(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                # Keepalive ping/pong
                if msg.get("type") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))
            except Exception:
                await websocket.send_text(json.dumps({"type": "PONG"}))
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


@app.get("/")
def root():
    return {
        "name": "FraudLens AI",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "FraudLens AI API",
        "version": "1.0.0",
    }
