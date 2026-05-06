from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from uuid import UUID

from api.deps import get_db, get_current_user
from models.user import User, UserRole
from models.restaurant import Restaurant
from models.announcement import Announcement
from models.settings import PlatformConfig
from models.ticket import Ticket
from schemas.superadmin import RestaurantOverview, SuperAdminDashboardStats, UpdateSubscriptionRequest, UserOverview, PlatformFinancialsResponse, RestaurantFinancial, AnnouncementCreate, AnnouncementResponse, PlatformSettingResponse, PlatformSettingUpdate
from schemas.auth import GenericResponse
from schemas.ticket import TicketResponse, TicketUpdateStatus
from models.billing import Bill, PaymentStatus

router = APIRouter()

def get_current_superadmin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPERADMIN:
        raise HTTPException(status_code=403, detail="Not authorized. Super Admin only.")
    return current_user

@router.get("/stats", response_model=SuperAdminDashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    total_restaurants = db.query(Restaurant).count()
    pending_approvals = db.query(Restaurant).filter(Restaurant.is_approved == False).count()
    active_subscriptions = db.query(Restaurant).filter(Restaurant.subscription_status == "active").count()
    total_users = db.query(User).count()
    
    return SuperAdminDashboardStats(
        total_restaurants=total_restaurants,
        pending_approvals=pending_approvals,
        active_subscriptions=active_subscriptions,
        total_users=total_users
    )

@router.get("/financials", response_model=PlatformFinancialsResponse)
def get_financials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    restaurants = db.query(Restaurant).all()
    
    # Calculate GMV per restaurant
    gmv_by_restaurant = dict(
        db.query(Bill.restaurant_id, func.sum(Bill.total_amount))
        .filter(Bill.status == PaymentStatus.COMPLETED)
        .group_by(Bill.restaurant_id)
        .all()
    )
    
    total_mrr = 0.0
    total_gmv = sum(gmv_by_restaurant.values()) if gmv_by_restaurant else 0.0
    active_subscriptions_by_plan = {"basic": 0, "pro": 0, "max": 0}
    
    restaurant_financials = []
    
    total_restaurants = len(restaurants)
    active_count = 0
    
    for r in restaurants:
        r_gmv = gmv_by_restaurant.get(r.id, 0.0)
        r_mrr = 0.0
        
        if r.subscription_status == "active":
            active_count += 1
            if r.subscription_plan == "basic":
                r_mrr = 499.0
                active_subscriptions_by_plan["basic"] += 1
            elif r.subscription_plan == "pro":
                r_mrr = 999.0
                active_subscriptions_by_plan["pro"] += 1
            elif r.subscription_plan == "max":
                r_mrr = 1399.0
                active_subscriptions_by_plan["max"] += 1
                
        total_mrr += r_mrr
        
        owner = db.query(User).filter(User.restaurant_id == r.id, User.role == UserRole.OWNER).first()
        
        restaurant_financials.append(RestaurantFinancial(
            restaurant_id=r.id,
            name=r.name,
            owner_email=owner.email if owner else None,
            subscription_plan=r.subscription_plan,
            subscription_status=r.subscription_status,
            mrr=r_mrr,
            gmv=r_gmv
        ))
        
    arpu = (total_mrr / active_count) if active_count > 0 else 0.0
    conversion_rate = (active_count / total_restaurants * 100) if total_restaurants > 0 else 0.0
    
    return PlatformFinancialsResponse(
        total_mrr=total_mrr,
        total_gmv=total_gmv,
        arpu=arpu,
        conversion_rate=conversion_rate,
        active_subscriptions_by_plan=active_subscriptions_by_plan,
        restaurant_financials=restaurant_financials
    )

@router.get("/restaurants", response_model=List[RestaurantOverview])
def get_all_restaurants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    restaurants = db.query(Restaurant).all()
    result = []
    
    for r in restaurants:
        owner = db.query(User).filter(User.restaurant_id == r.id, User.role == UserRole.OWNER).first()
        result.append(RestaurantOverview(
            id=r.id,
            name=r.name,
            owner_name=owner.full_name if owner else None,
            owner_email=owner.email if owner else None,
            owner_phone=owner.phone_number if owner else None,
            is_approved=r.is_approved,
            subscription_status=r.subscription_status,
            subscription_plan=r.subscription_plan,
            subscription_ends_at=r.subscription_ends_at,
            created_at=r.created_at
        ))
    return result

@router.put("/restaurants/{restaurant_id}/approve", response_model=RestaurantOverview)
def approve_restaurant(
    restaurant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    restaurant.is_approved = True
    db.commit()
    db.refresh(restaurant)
    
    owner = db.query(User).filter(User.restaurant_id == restaurant.id, User.role == UserRole.OWNER).first()
    return RestaurantOverview(
        id=restaurant.id,
        name=restaurant.name,
        owner_name=owner.full_name if owner else None,
        owner_email=owner.email if owner else None,
        owner_phone=owner.phone_number if owner else None,
        is_approved=restaurant.is_approved,
        subscription_status=restaurant.subscription_status,
        subscription_plan=restaurant.subscription_plan,
        subscription_ends_at=restaurant.subscription_ends_at,
        created_at=restaurant.created_at
    )

@router.put("/restaurants/{restaurant_id}/subscription", response_model=RestaurantOverview)
def update_subscription(
    restaurant_id: str,
    req: UpdateSubscriptionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    restaurant.subscription_plan = req.plan
    restaurant.subscription_status = req.status
    if req.expiry_date is not None:
        restaurant.subscription_ends_at = req.expiry_date
    db.commit()
    db.refresh(restaurant)
    
    owner = db.query(User).filter(User.restaurant_id == restaurant.id, User.role == UserRole.OWNER).first()
    return RestaurantOverview(
        id=restaurant.id,
        name=restaurant.name,
        owner_name=owner.full_name if owner else None,
        owner_email=owner.email if owner else None,
        owner_phone=owner.phone_number if owner else None,
        is_approved=restaurant.is_approved,
        subscription_status=restaurant.subscription_status,
        subscription_plan=restaurant.subscription_plan,
        subscription_ends_at=restaurant.subscription_ends_at,
        created_at=restaurant.created_at
    )

@router.get("/users", response_model=List[UserOverview])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    users = db.query(User).all()
    result = []
    for u in users:
        result.append(UserOverview(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            phone_number=u.phone_number,
            role=u.role.value,
            restaurant_name=u.restaurant.name if u.restaurant else None,
            is_approved=u.is_approved,
            created_at=u.created_at
        ))
    return result

@router.delete("/restaurants/{restaurant_id}")
def delete_restaurant(
    restaurant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    db.delete(restaurant)
    db.commit()
    return {"message": "Restaurant deleted successfully"}

@router.post("/restaurants/{restaurant_id}/impersonate", response_model=GenericResponse)
def impersonate_restaurant_owner(
    restaurant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    owner = db.query(User).filter(User.restaurant_id == restaurant_id, User.role == UserRole.OWNER).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Restaurant owner not found")
        
    from api.api_v1.auth import _make_local_token, _build_auth_data
    access_token = _make_local_token(str(owner.id), owner.email, owner.role.value)
    
    return GenericResponse(
        message=f"Impersonating owner: {owner.full_name or owner.email}",
        data=_build_auth_data(owner, access_token)
    )

@router.post("/users/{user_id}/impersonate", response_model=GenericResponse)
def impersonate_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if target_user.role == UserRole.SUPERADMIN:
        raise HTTPException(status_code=403, detail="Cannot impersonate another super admin")
        
    from api.api_v1.auth import _make_local_token, _build_auth_data
    access_token = _make_local_token(str(target_user.id), target_user.email, target_user.role.value)
    
    return GenericResponse(
        message=f"Impersonating user: {target_user.full_name or target_user.email}",
        data=_build_auth_data(target_user, access_token)
    )

@router.post("/announcements", response_model=AnnouncementResponse)
def create_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    announcement = Announcement(
        title=payload.title,
        message=payload.message,
        target_role=payload.target_role,
        is_active=payload.is_active
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement

@router.get("/announcements", response_model=List[AnnouncementResponse])
def get_all_announcements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    return db.query(Announcement).order_by(Announcement.created_at.desc()).all()

@router.delete("/announcements/{announcement_id}")
def delete_announcement(
    announcement_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    db.delete(announcement)
    db.commit()
    return {"message": "Announcement deleted successfully"}

@router.get("/platform-settings", response_model=List[PlatformSettingResponse])
def get_platform_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    return db.query(PlatformConfig).all()

@router.put("/platform-settings")
def update_platform_settings(
    settings_in: List[PlatformSettingUpdate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    for s in settings_in:
        config = db.query(PlatformConfig).filter(PlatformConfig.key == s.key).first()
        if config:
            config.value = s.value
    db.commit()
    return {"message": "Platform settings updated successfully"}

@router.get("/tickets", response_model=List[TicketResponse])
def get_all_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).all()
    # Populate restaurant names for superadmin
    for t in tickets:
        rest = db.query(Restaurant).filter(Restaurant.id == t.restaurant_id).first()
        t.restaurant_name = rest.name if rest else "Unknown"
    return tickets

@router.put("/tickets/{ticket_id}", response_model=TicketResponse)
def update_ticket_status(
    ticket_id: UUID,
    update_data: TicketUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket.status = update_data.status
    if update_data.resolution_notes is not None:
        ticket.resolution_notes = update_data.resolution_notes
        
    from datetime import datetime, timezone
    if update_data.status == "RESOLVED" and not ticket.resolved_at:
        ticket.resolved_at = datetime.now(timezone.utc)
    elif update_data.status != "RESOLVED":
        ticket.resolved_at = None
        
    db.commit()
    db.refresh(ticket)
    
    rest = db.query(Restaurant).filter(Restaurant.id == ticket.restaurant_id).first()
    ticket.restaurant_name = rest.name if rest else "Unknown"
    return ticket
