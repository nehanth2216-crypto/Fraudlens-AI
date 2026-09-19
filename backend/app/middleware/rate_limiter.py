"""
FraudLens AI — Rate Limiting Middleware
Lightweight in-memory sliding-window rate limiter for sensitive fraud API routes.
"""

import time
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class SimpleRateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests_per_minute: int = 120):
        super().__init__(app)
        self.max_requests = max_requests_per_minute
        # client_ip -> list of timestamps
        self.request_history = defaultdict(list)
        # Slower limits for sensitive auth endpoints (30 requests/minute)
        self.auth_limits = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Only rate limit API routes
        if not request.url.path.startswith("/api/"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window_start = now - 60.0

        # Special check for auth login endpoint (prevent brute force)
        if request.url.path == "/api/auth/login" and request.method == "POST":
            self.auth_limits[client_ip] = [
                ts for ts in self.auth_limits[client_ip] if ts > window_start
            ]
            if len(self.auth_limits[client_ip]) >= 30:
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Too many login attempts. Please wait 60 seconds before retrying.",
                        "retry_after": 60,
                    },
                )
            self.auth_limits[client_ip].append(now)

        # General API rate limit (120 requests/minute per client IP)
        history = [ts for ts in self.request_history[client_ip] if ts > window_start]
        self.request_history[client_ip] = history

        if len(history) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Too many requests to FraudLens AI API.",
                    "retry_after": 60,
                },
            )

        self.request_history[client_ip].append(now)
        response = await call_next(request)
        return response
