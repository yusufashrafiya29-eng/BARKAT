from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from api.deps import get_db, get_current_user_token, get_current_restaurant
from schemas.user import UserRead
from models.user import User, UserRole

router = APIRouter()

def require_owner(token: dict = Depends(get_current_user_token)):
    if token.get("role") != "OWNER":
        raise HTTPException(status_code=403, detail="Not authorized. Owner access required.")
    return token

@router.get("/staff", response_model=List[UserRead])
def get_staff_members(
    db: Session = Depends(get_db), 
    token: dict = Depends(require_owner),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    """Fetch all non-owner staff (waiters/kitchen)."""
    return db.query(User).filter(User.role != UserRole.OWNER, User.restaurant_id == str(restaurant_id)).all()

@router.put("/staff/{user_id}/verify", response_model=UserRead)
def verify_staff_member(
    user_id: UUID,
    db: Session = Depends(get_db),
    token: dict = Depends(require_owner),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    """Approve a staff member so they can log in."""
    user = db.query(User).filter(User.id == user_id, User.restaurant_id == str(restaurant_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_verified = True
    db.commit()
    db.refresh(user)
    return user

@router.delete("/staff/{user_id}")
def delete_staff_member(
    user_id: UUID,
    db: Session = Depends(get_db),
    token: dict = Depends(require_owner),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    """Remove a staff member."""
    user = db.query(User).filter(User.id == user_id, User.restaurant_id == str(restaurant_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user)
    db.commit()
    return {"message": "Staff member deleted successfully"}

from schemas.auth import StaffSignupRequest
@router.post("/staff", response_model=UserRead)
def create_staff_member(
    payload: StaffSignupRequest,
    db: Session = Depends(get_db),
    token: dict = Depends(require_owner),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    """Owner instantly creates a verified staff member."""
    from api.api_v1.auth import _hash_password
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")
        
    try:
        role = UserRole(payload.role.upper())
        if role not in [UserRole.WAITER, UserRole.KITCHEN]:
            raise ValueError()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid staff role. Use WAITER or KITCHEN.")

    new_user = User(
        email=payload.email,
        full_name=payload.full_name,
        phone_number=payload.phone_number,
        role=role,
        restaurant_id=str(restaurant_id),
        restaurant_email=payload.restaurant_email,
        password_hash=_hash_password(payload.password),
        is_verified=True # Automatically verified since owner creates it!
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
