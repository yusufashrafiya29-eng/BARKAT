from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from api.deps import get_db, get_current_user_token
from schemas.auth import (
    SignupRequest, OwnerSignupRequest, StaffSignupRequest, 
    LoginRequest, AuthResponse, GenericResponse, 
    OTPVerifyRequest, OTPSendRequest
)
from services.otp_service import OTPService
from models.user import User, UserRole
from models.restaurant import Restaurant
from core.config import settings
import jwt as pyjwt
import bcrypt
import uuid

router = APIRouter()

# ... (Helpers) ...
def _make_local_token(user_id: str, email: str, role: str) -> str:
    """Mint a local JWT signed with JWT_SECRET — used in dev mode."""
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.utcnow() + timedelta(days=7),
        "iat": datetime.utcnow(),
    }
    return pyjwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _build_auth_data(local_user: User, access_token: str) -> AuthResponse:
    return AuthResponse(
        access_token=access_token,
        user_id=str(local_user.id),
        email=local_user.email,
        role=local_user.role.value,
        full_name=local_user.full_name,
        phone_number=local_user.phone_number,
        is_verified=local_user.is_verified,
        created_at=local_user.created_at,
    )


# ─── Signup Endpoints ─────────────────────────────────────────────────────────

@router.post("/signup/owner", response_model=GenericResponse, status_code=status.HTTP_201_CREATED)
def signup_owner(payload: OwnerSignupRequest, db: Session = Depends(get_db)):
    """Register a new restaurant owner."""
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")

    # First create the Restaurant
    restaurant = Restaurant(
        name=payload.restaurant_name
    )
    db.add(restaurant)
    db.flush() # flush to get the UUID

    new_user = User(
        email=payload.email,
        full_name=payload.full_name,
        phone_number=payload.phone_number,
        role=UserRole.OWNER,
        restaurant_id=restaurant.id,
        password_hash=_hash_password(payload.password),
        is_verified=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Trigger OTP
    OTPService.create_otp(db, payload.email)

    return GenericResponse(
        message="Owner registered successfully. Please verify your OTP.",
        data={"email": payload.email}
    )


@router.post("/signup/staff", response_model=GenericResponse, status_code=status.HTTP_201_CREATED)
def signup_staff(payload: StaffSignupRequest, db: Session = Depends(get_db)):
    """Register a new waiter or kitchen staff."""
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")

    try:
        role = UserRole(payload.role.upper())
        if role not in [UserRole.WAITER, UserRole.KITCHEN]:
            raise ValueError()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid staff role. Use WAITER or KITCHEN.")

    # Find owner to link restaurant
    owner = db.query(User).filter(
        User.email == payload.restaurant_email,
        User.role == UserRole.OWNER
    ).first()
    
    if not owner or not owner.restaurant_id:
        raise HTTPException(
            status_code=404, 
            detail="Restaurant owner not found. Please check the owner's email address."
        )

    new_user = User(
        email=payload.email,
        full_name=payload.full_name,
        phone_number=payload.phone_number,
        role=role,
        restaurant_id=owner.restaurant_id,
        restaurant_email=payload.restaurant_email,
        password_hash=_hash_password(payload.password),
        is_verified=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Trigger OTP
    OTPService.create_otp(db, payload.email)

    return GenericResponse(
        message="Staff registered successfully. Please verify your OTP.",
        data={"email": payload.email}
    )


# ─── Auth Endpoints ───────────────────────────────────────────────────────────

@router.post("/login", response_model=GenericResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Log in with email + password."""
    local_user = db.query(User).filter(User.email == payload.email).first()

    if not local_user or not _verify_password(payload.password, local_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    if not local_user.is_verified:
        # Trigger OTP generation
        OTPService.create_otp(db, local_user.email)
        return GenericResponse(
            message="OTP verification required",
            data={"email": local_user.email, "is_verified": False}
        )

    access_token = _make_local_token(str(local_user.id), local_user.email, local_user.role.value)
    
    # Update last_login_at
    local_user.last_login_at = datetime.utcnow()
    db.commit()

    return GenericResponse(
        message="Login successful",
        data=_build_auth_data(local_user, access_token)
    )


@router.post("/send-otp", response_model=GenericResponse)
def send_otp(payload: OTPSendRequest, db: Session = Depends(get_db)):
    """Generate and send a new OTP."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    OTPService.create_otp(db, payload.email)
    return GenericResponse(message="OTP sent successfully.")


@router.post("/verify-otp", response_model=GenericResponse)
def verify_otp(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    """Verify the provided OTP."""
    success = OTPService.verify_otp(db, payload.email, payload.otp_code)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")
    
    return GenericResponse(message="Account verified successfully.")


@router.get("/me", response_model=GenericResponse)
def get_current_user_info(
    token_payload: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    """Returns the current authenticated user's profile."""
    user_email = token_payload.get("email")
    local_user = db.query(User).filter(User.email == user_email).first()
    
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found.")

    return GenericResponse(
        message="Profile retrieved",
        data={
            "id": str(local_user.id),
            "email": local_user.email,
            "role": local_user.role.value,
            "full_name": local_user.full_name,
            "phone_number": local_user.phone_number,
            "is_verified": local_user.is_verified,
            "restaurant_id": str(local_user.restaurant_id) if local_user.restaurant_id else None,
            "restaurant_email": local_user.restaurant_email,
            "created_at": local_user.created_at.isoformat() if local_user.created_at else None,
        }
    )
