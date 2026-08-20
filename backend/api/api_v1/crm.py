from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import io
import csv
import jwt
from datetime import datetime

from api.deps import get_db, get_current_restaurant
from models.customer import Customer
from models.user import User
from api.api_v1.users import require_owner
from core.config import settings

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

@router.get("/csv")
def download_customers_csv(
    token_str: str = None,
    db: Session = Depends(get_db)
):
    """Download CRM customers report in CSV format."""
    
    # Try resolving token from query param since this is a direct browser download
    if token_str:
        try:
            token = jwt.decode(token_str, settings.JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid query token")
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception("Unexpected error decoding token in download_customers_csv")
            raise HTTPException(status_code=401, detail="Invalid query token")
    elif not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    require_owner(token)
    
    # Manually get restaurant_id from token
    user = db.query(User).filter(User.email == token.get("email")).first()
    if not user or not user.restaurant_id:
        raise HTTPException(status_code=400, detail="User not linked to any restaurant")
    restaurant_id = user.restaurant_id
    
    customers = db.query(Customer).filter(
        Customer.restaurant_id == str(restaurant_id)
    ).order_by(Customer.loyalty_points.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write Header Info
    writer.writerow(["CUSTOMER CRM EXPORT"])
    writer.writerow(["Exported On:", datetime.now().strftime('%d-%b-%Y %H:%M')])
    writer.writerow([])
    
    # Write Column Headers
    writer.writerow([
        "Customer Name", 
        "Phone Number", 
        "Email", 
        "Loyalty Points", 
        "Total Spent (Rs)", 
        "Total Visits", 
        "First Visit",
        "Last Visit"
    ])
    
    for c in customers:
        writer.writerow([
            c.name or "Guest",
            c.phone_number or "N/A",
            c.email or "N/A",
            c.loyalty_points,
            round(c.total_spent, 2),
            c.total_visits,
            c.created_at.strftime('%d-%b-%Y') if c.created_at else "N/A",
            c.updated_at.strftime('%d-%b-%Y') if c.updated_at else "N/A"
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]), 
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=customers_{datetime.now().strftime('%Y%m%d')}.csv"}
    )
