from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from api.deps import get_db, get_current_user_token, get_current_restaurant
from schemas.user import UserRead
from models.user import User, UserRole
from models.announcement import Announcement
from schemas.superadmin import AnnouncementResponse
from schemas.ticket import TicketCreate, TicketResponse
from models.ticket import Ticket

router = APIRouter()

def require_owner(token: dict = Depends(get_current_user_token)):
    if token.get("role") != "OWNER":
        raise HTTPException(status_code=403, detail="Not authorized. Owner access required.")
    return token

from schemas.user import PasswordChange
@router.put("/me/password")
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token)
):
    from api.api_v1.auth import _hash_password, _verify_password
    
    user = db.query(User).filter(User.id == token.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not _verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    user.password_hash = _hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


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
    
    user.is_approved = True
    user.is_verified = True  # Also mark as verified in case OTP was skipped
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
        if role not in [UserRole.WAITER, UserRole.KITCHEN, UserRole.MANAGER]:
            raise ValueError()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid staff role. Use WAITER, KITCHEN, or MANAGER.")

    new_user = User(
        email=payload.email,
        full_name=payload.full_name,
        phone_number=payload.phone_number,
        role=role,
        restaurant_id=str(restaurant_id),
        restaurant_email=payload.restaurant_email,
        password_hash=_hash_password(payload.password),
        is_verified=True,   # Owner-created staff skips OTP
        is_approved=True    # Owner-created staff is instantly approved
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

from pydantic import BaseModel
class RoleUpdateRequest(BaseModel):
    role: str

@router.put("/staff/{user_id}/role", response_model=UserRead)
def update_staff_role(
    user_id: UUID,
    payload: RoleUpdateRequest,
    db: Session = Depends(get_db),
    token: dict = Depends(require_owner),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    """Update the role of an existing staff member."""
    user = db.query(User).filter(User.id == user_id, User.restaurant_id == str(restaurant_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    try:
        role = UserRole(payload.role.upper())
        if role not in [UserRole.WAITER, UserRole.KITCHEN, UserRole.MANAGER]:
            raise ValueError()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid staff role. Use WAITER, KITCHEN, or MANAGER.")
        
    user.role = role
    db.commit()
    db.refresh(user)
    return user

@router.get("/announcements/active", response_model=List[AnnouncementResponse])
def get_active_announcements(
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token)
):
    """Fetch active announcements for the current user's role."""
    role = token.get("role", "")
    
    # Target either 'ALL' or specifically the user's role (e.g. 'OWNER')
    return db.query(Announcement).filter(
        Announcement.is_active == True,
        Announcement.target_role.in_(["ALL", role])
    ).order_by(Announcement.created_at.desc()).all()

@router.get("/tickets", response_model=List[TicketResponse])
def get_restaurant_tickets(
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant)
):
    """Get all tickets created by this restaurant."""
    return db.query(Ticket).filter(Ticket.restaurant_id == restaurant_id).order_by(Ticket.created_at.desc()).all()

@router.post("/tickets", response_model=TicketResponse)
def create_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
    restaurant_id: UUID = Depends(get_current_restaurant),
    token: dict = Depends(get_current_user_token)
):
    """Create a new support ticket."""
    user_id = UUID(token.get("sub"))
    
    ticket = Ticket(
        restaurant_id=restaurant_id,
        opened_by_id=user_id,
        subject=ticket_in.subject,
        description=ticket_in.description,
        status="OPEN"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket
