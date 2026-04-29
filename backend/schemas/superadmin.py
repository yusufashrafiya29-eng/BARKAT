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
    created_at: datetime

class SuperAdminDashboardStats(BaseModel):
    total_restaurants: int
    pending_approvals: int
    active_subscriptions: int

class UpdateSubscriptionRequest(BaseModel):
    plan: str
    status: str
