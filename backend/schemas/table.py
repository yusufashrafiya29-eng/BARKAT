from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

class TableBase(BaseModel):
    table_number: int = Field(..., gt=0)
    capacity: int = Field(default=4, ge=1)
    category: str = "Non-AC"
    qr_code_url: Optional[str] = None
    position_x: Optional[float] = Field(default=0.0, ge=0.0, le=100.0)
    position_y: Optional[float] = Field(default=0.0, ge=0.0, le=100.0)

class TablePositionUpdate(BaseModel):
    id: UUID
    position_x: float
    position_y: float

class TableCreate(TableBase):
    pass

class TableRead(TableBase):
    id: UUID
    restaurant_id: UUID

    class Config:
        from_attributes = True
