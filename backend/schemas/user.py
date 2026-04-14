from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from models.user import UserRole
from typing import Optional


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone_number: str  # Now required for OTP
    role: UserRole = UserRole.WAITER
    is_active: bool = True
    is_verified: bool = False
    restaurant_name: Optional[str] = None
    restaurant_email: Optional[str] = None


class UserCreate(UserBase):
    """Used when creating a user record manually (admin action)."""
    pass


class UserRead(UserBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Partial update — all fields optional."""
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
