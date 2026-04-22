from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from api.deps import get_db, get_current_user_token, get_current_restaurant
from schemas.settings import UPIConfig, RazorpayConfig
from services import settings_service

router = APIRouter()

@router.put("/restaurant-profile")
def update_restaurant_profile(
    name: str = Form(None),
    logo: UploadFile = File(None),
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token),
    restaurant_id=Depends(get_current_restaurant)
):
    """(Secure) Update restaurant name and logo. Owner only."""
    if token.get("role") != "OWNER":
        raise HTTPException(status_code=403, detail="Owner access required")
    
    from models.restaurant import Restaurant
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    if name:
        restaurant.name = name
        
    if logo and logo.filename:
        from db.supabase import supabase_client
        import uuid
        file_ext = logo.filename.split('.')[-1]
        file_name = f"{uuid.uuid4()}.{file_ext}"
        
        logo_content = logo.file.read()
        res = supabase_client.storage.from_('logos').upload(
            path=file_name,
            file=logo_content,
            file_options={"content-type": logo.content_type}
        )
        
        # Get public URL
        public_url = supabase_client.storage.from_('logos').get_public_url(file_name)
        restaurant.logo_url = public_url
        
    db.commit()
    return {"message": "Profile updated", "name": restaurant.name, "logo_url": restaurant.logo_url}

@router.get("/upi", response_model=UPIConfig)
def get_upi_id(
    db: Session = Depends(get_db),
    restaurant_id=Depends(get_current_restaurant)
):
    """Fetch the store's configured UPI ID."""
    upi_id = settings_service.get_config_value(db, "upi_id", str(restaurant_id))
    if not upi_id:
        return {"upi_id": ""}
    return {"upi_id": upi_id}

@router.post("/upi", response_model=UPIConfig)
def update_upi_id(
    config_in: UPIConfig,
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token),
    restaurant_id=Depends(get_current_restaurant)
):
    """(Secure) Update the store's UPI ID. Owner only."""
    if token.get("role") != "OWNER":
        raise HTTPException(status_code=403, detail="Owner access required")
    
    settings_service.set_config_value(db, "upi_id", config_in.upi_id, str(restaurant_id))
    return {"upi_id": config_in.upi_id}

@router.get("/razorpay", response_model=RazorpayConfig)
def get_razorpay_keys(
    db: Session = Depends(get_db),
    restaurant_id=Depends(get_current_restaurant),
    token: dict = Depends(get_current_user_token)
):
    """Fetch the store's configured Razorpay keys. Owner only (for display in settings)."""
    if token.get("role") != "OWNER":
        raise HTTPException(status_code=403, detail="Owner access required")
        
    key_id = settings_service.get_config_value(db, "razorpay_key_id", str(restaurant_id))
    key_secret = settings_service.get_config_value(db, "razorpay_key_secret", str(restaurant_id))
    
    return {
        "razorpay_key_id": key_id or "",
        "razorpay_key_secret": key_secret or ""
    }

@router.post("/razorpay", response_model=RazorpayConfig)
def update_razorpay_keys(
    config_in: RazorpayConfig,
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user_token),
    restaurant_id=Depends(get_current_restaurant)
):
    """(Secure) Update the store's Razorpay keys. Owner only."""
    if token.get("role") != "OWNER":
        raise HTTPException(status_code=403, detail="Owner access required")
    
    settings_service.set_config_value(db, "razorpay_key_id", config_in.razorpay_key_id, str(restaurant_id))
    settings_service.set_config_value(db, "razorpay_key_secret", config_in.razorpay_key_secret, str(restaurant_id))
    
    return config_in
