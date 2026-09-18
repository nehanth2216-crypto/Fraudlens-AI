"""
FraudLens AI — Authentication API Routes
Register, login, logout, and user profile endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import UserRegister, UserLogin, TokenResponse, UserResponse
from app.services.auth_service import register_user, authenticate_user, create_access_token
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user."""
    user = register_user(db, data.name, data.email, data.password, data.role.value)
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate and receive JWT token."""
    user = authenticate_user(db, data.email, data.password)
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_active_user)):
    """Get current authenticated user profile."""
    return user


@router.post("/logout")
def logout():
    """Logout (client-side token removal)."""
    return {"message": "Logged out successfully"}
