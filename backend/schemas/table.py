from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class TableBase(BaseModel):
    table_number: int
    capacity: int = 4
    category: str = "Non-AC"
    qr_code_url: Optional[str] = None

class TableCreate(TableBase):
    pass

class TableRead(TableBase):
    id: UUID
    restaurant_id: UUID

    class Config:
        from_attributes = True
