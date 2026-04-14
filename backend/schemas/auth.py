from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


from typing import Any


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone_number: str
    role: str = "WAITER"


class OwnerSignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: str
    restaurant_name: str


class StaffSignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: str
    restaurant_email: str
    role: str  # WAITER or KITCHEN


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str


class OTPSendRequest(BaseModel):
    email: EmailStr


class AuthResponse(BaseModel):
    access_token: str
    user_id: str
    email: str
    role: str
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    is_verified: bool = False
    created_at: Optional[datetime] = None


class GenericResponse(BaseModel):
    message: str
    data: Optional[Any] = None
