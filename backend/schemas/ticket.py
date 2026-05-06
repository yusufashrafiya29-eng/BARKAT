from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class TicketBase(BaseModel):
    subject: str
    description: str

class TicketCreate(TicketBase):
    pass

class TicketResponse(TicketBase):
    id: UUID
    restaurant_id: UUID
    opened_by_id: UUID
    status: str
    resolution_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    
    # Let's optionally return the restaurant name for super admin context
    restaurant_name: Optional[str] = None

    class Config:
        from_attributes = True

class TicketUpdateStatus(BaseModel):
    status: str
    resolution_notes: Optional[str] = None
