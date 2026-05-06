from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime

class RestaurantOverview(BaseModel):
    id: UUID4
    name: str
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    owner_phone: Optional[str] = None
    is_approved: bool
    subscription_status: str
    subscription_plan: str
    subscription_ends_at: Optional[datetime] = None
    created_at: datetime

class SuperAdminDashboardStats(BaseModel):
    total_restaurants: int
    pending_approvals: int
    active_subscriptions: int
    total_users: int

class UpdateSubscriptionRequest(BaseModel):
    plan: str
    status: str
    expiry_date: Optional[datetime] = None

class UserOverview(BaseModel):
    id: UUID4
    full_name: Optional[str] = None
    email: str
    phone_number: Optional[str] = None
    role: str
    restaurant_name: Optional[str] = None
    is_approved: bool
    created_at: datetime

class RestaurantFinancial(BaseModel):
    restaurant_id: UUID4
    name: str
    owner_email: Optional[str] = None
    subscription_plan: str
    subscription_status: str
    mrr: float
    gmv: float
    
class PlatformFinancialsResponse(BaseModel):
    total_mrr: float
    total_gmv: float
    arpu: float
    conversion_rate: float
    active_subscriptions_by_plan: dict
    restaurant_financials: List[RestaurantFinancial]

class AnnouncementCreate(BaseModel):
    title: str
    message: str
    target_role: str = "ALL"
    is_active: bool = True

class AnnouncementResponse(BaseModel):
    id: UUID4
    title: str
    message: str
    target_role: str
    is_active: bool
    created_at: datetime

class PlatformSettingUpdate(BaseModel):
    key: str
    value: str

class PlatformSettingResponse(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

