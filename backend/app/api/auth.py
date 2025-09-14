"""Authentication endpoints for the Context Platform."""

from fastapi import APIRouter, HTTPException
from supabase import create_client, Client
from typing import Dict, Any
from app.models import AuthRequest, EmailCheckRequest
from app.config import settings

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["auth"]
)

# Supabase client using anon key for auth operations
supabase: Client = create_client(settings.supabase_url, settings.supabase_anon_key)


@router.post("/login")
async def login(data: AuthRequest) -> Dict[str, Any]:
    """
    Sign in a user with email and password.
    
    Returns access token and user info.
    """
    try:
        response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })
        
        if response.session and response.user:
            return {
                "access_token": response.session.access_token,
                "user": {
                    "id": response.user.id,
                    "email": response.user.email
                }
            }
        
        raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception as e:
        error_msg = str(e)
        if "Invalid login credentials" in error_msg:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        raise HTTPException(status_code=400, detail=error_msg)


@router.post("/signup")
async def signup(data: AuthRequest) -> Dict[str, Any]:
    """
    Register a new user with email and password.
    
    Returns access token and user info.
    """
    try:
        response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password
        })
        
        if response.session and response.user:
            return {
                "access_token": response.session.access_token,
                "user": {
                    "id": response.user.id,
                    "email": response.user.email
                }
            }
        
        # User created but email confirmation might be required
        if response.user and not response.session:
            return {
                "message": "Please check your email to confirm your account",
                "user": {
                    "id": response.user.id,
                    "email": response.user.email
                }
            }
        
        raise HTTPException(status_code=400, detail="Failed to create account")
    except Exception as e:
        error_msg = str(e)
        if "already registered" in error_msg.lower():
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail=error_msg)


@router.post("/check-email")
async def check_email(request: EmailCheckRequest) -> Dict[str, Any]:
    """
    Check if an email is already registered.
    
    Returns whether the user exists without revealing sensitive info.
    """
    try:
        # Try to sign in with an impossible password
        # If the email doesn't exist, we'll get a different error
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": "impossible_password_check_123456789"
        })
        # Should never succeed
        return {"exists": True}
    except Exception as e:
        error_msg = str(e)
        if "Invalid login credentials" in error_msg:
            # User exists (wrong password)
            return {"exists": True}
        else:
            # User doesn't exist or other error
            return {"exists": False}


@router.post("/logout")
async def logout() -> Dict[str, str]:
    """
    Sign out the current user.
    
    Note: This is mainly for client-side session cleanup.
    """
    # Supabase handles logout client-side
    # This endpoint is for consistency
    return {"message": "Logged out successfully"}