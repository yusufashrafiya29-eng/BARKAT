from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class TableBase(BaseModel):
    table_number: int
    capacity: int = 4
    category: str = "Non-AC"
    qr_code_url: Optional[str] = None
    position_x: Optional[float] = 0.0
    position_y: Optional[float] = 0.0

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
