"""Authentication models for the Context Platform."""

from pydantic import BaseModel, EmailStr


class AuthRequest(BaseModel):
    """Request model for authentication."""
    email: EmailStr
    password: str


class EmailCheckRequest(BaseModel):
    """Request model for checking if email exists."""
    email: EmailStr