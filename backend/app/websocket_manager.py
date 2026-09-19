"""
FraudLens AI — Real-Time WebSocket Manager
Handles live streaming of transactions, ML risk scores, and fraud alerts.
"""

import json
import asyncio
from typing import Set
from fastapi import WebSocket


class WebSocketManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        # Send initial handshake message
        try:
            await websocket.send_text(
                json.dumps({
                    "type": "CONNECTION_ESTABLISHED",
                    "message": "Connected to FraudLens AI Real-Time Telemetry Stream",
                    "client_count": len(self.active_connections),
                })
            )
        except Exception:
            self.active_connections.discard(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, event_type: str, data: dict):
        """Broadcast payload to all connected WebSocket clients asynchronously."""
        if not self.active_connections:
            return

        payload = json.dumps({"type": event_type, "payload": data})
        dead_connections = set()

        for conn in list(self.active_connections):
            try:
                await conn.send_text(payload)
            except Exception:
                dead_connections.add(conn)

        self.active_connections -= dead_connections

    def broadcast_sync(self, event_type: str, data: dict):
        """Safe non-blocking broadcast callable from synchronous request threads."""
        if not self.active_connections:
            return

        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.broadcast(event_type, data))
        except RuntimeError:
            # If no running loop in thread, spawn a new runner
            try:
                asyncio.run(self.broadcast(event_type, data))
            except Exception as e:
                print(f"[WARN] WebSocket broadcast error: {e}")


ws_manager = WebSocketManager()
