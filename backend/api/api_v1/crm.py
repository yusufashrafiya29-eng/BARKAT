from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from api.deps import get_db, get_current_restaurant
from models.customer import Customer
from api.api_v1.users import require_owner

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
def get_all_customers(
    db: Session = Depends(get_db),
    token: dict = Depends(require_owner),
    restaurant_id=Depends(get_current_restaurant)
):
    """
    Secure endpoint to fetch all customers for the restaurant's CRM.
    Orders them by loyalty points (highest first) as default sorting.
    """
    customers = db.query(Customer).filter(
        Customer.restaurant_id == str(restaurant_id)
    ).order_by(Customer.loyalty_points.desc()).all()
    
    return [
        {
            "id": str(c.id),
            "name": c.name or "Guest",
            "phone_number": c.phone_number,
            "email": c.email,
            "loyalty_points": c.loyalty_points,
            "total_spent": c.total_spent,
            "total_visits": c.total_visits,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "last_visit": c.updated_at.isoformat() if c.updated_at else None
        }
        for c in customers
    ]
