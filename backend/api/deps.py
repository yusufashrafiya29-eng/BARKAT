from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from db.session import SessionLocal
from core.config import settings
import jwt
from jwt.exceptions import InvalidTokenError
from typing import Generator

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

def get_db() -> Generator[Session, None, None]:
    """Dependency to generate a database session per HTTP request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verifies the JWT token from the Authorization header using our secret."""
    try:
        # Supabase signs JWTs with HS256 algorithm and the project's JWT Secret.
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False} 
            # Note: audience verification can be enabled if required (usually 'authenticated')
        )
        return payload
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials - Token invalid or expired.",
        )

def get_optional_user_token(credentials: HTTPAuthorizationCredentials = Depends(optional_security)) -> dict:
    if not credentials:
        return None
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False} 
        )
        return payload
    except InvalidTokenError:
        return None

def get_current_user(
    db: Session = Depends(get_db),
    token_payload: dict = Depends(get_current_user_token)
):
    from models.user import User
    user_email = token_payload.get("email")
    if not user_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")
    
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    
    return user

def get_current_restaurant(user = Depends(get_current_user)):
    if not user.restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="User is not linked to any restaurant."
        )
    return user.restaurant_id

#     """
#     Mocked security dependency. 
#     Returns a fake token payload to bypass Supabase JWT authentication for local Postman testing.
#     """
#     return {
#         "sub": "mock-admin-id-1234",
#         "email": "admin@barkat.local",
#         "role": "admin"
#     }
