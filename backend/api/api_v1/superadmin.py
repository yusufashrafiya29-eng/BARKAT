from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from api.deps import get_db, get_current_user
from models.user import User, UserRole
from models.restaurant import Restaurant
from schemas.superadmin import RestaurantOverview, SuperAdminDashboardStats, UpdateSubscriptionRequest, UserOverview


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
