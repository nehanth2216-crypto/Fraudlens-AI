"""
FraudLens AI — Authentication & Authorization Dependencies
Shared FastAPI dependencies for JWT auth and role-based access.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import get_current_user
from app.models.user import User

security = HTTPBearer()


def get_current_active_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Extract and validate the current user from JWT token."""
    token = credentials.credentials
    return get_current_user(db, token)


def require_roles(*roles):
    """Dependency factory for role-based access control."""
    def role_checker(user: User = Depends(get_current_active_user)):
        if user.role.value not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {list(roles)}",
            )
        return user
    return role_checker
