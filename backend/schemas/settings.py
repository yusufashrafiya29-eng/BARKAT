from pydantic import BaseModel
from pydantic.types import UUID4

class RestaurantConfigBase(BaseModel):
    key: str
    value: str

class RestaurantConfigRead(RestaurantConfigBase):
    id: UUID4

    class Config:
        from_attributes = True

class UPIConfig(BaseModel):
    upi_id: str
