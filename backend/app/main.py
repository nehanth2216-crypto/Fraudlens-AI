"""
FraudLens AI — Main Application Entry Point
FastAPI application with CORS, WebSocket, and all route mounting.
"""

import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
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
    reports_router, assistant_router, data_router,
)
from app.api.v2_routes import router as v2_router
from app.services.fraud_service import ws_connections


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

    print("[INFO] FraudLens AI - Shutting down")



app = FastAPI(
    title="FraudLens AI",
    description="Intelligent Real-Time Financial Fraud Detection & Investigation Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
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
app.include_router(v2_router)



# WebSocket endpoint for real-time alerts
@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await websocket.accept()
    ws_connections.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for keepalive
            await websocket.send_text(json.dumps({"type": "PONG"}))
    except WebSocketDisconnect:
        ws_connections.discard(websocket)


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
    return {"status": "healthy"}
