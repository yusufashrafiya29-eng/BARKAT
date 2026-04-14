from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from db.session import SessionLocal
from core.config import settings
import jwt
from jwt.exceptions import InvalidTokenError
from typing import Generator

security = HTTPBearer()

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
            headers={"WWW-Authenticate": "Bearer"},
        )

# def get_current_user_token() -> dict:
#     """
#     Mocked security dependency. 
#     Returns a fake token payload to bypass Supabase JWT authentication for local Postman testing.
#     """
#     return {
#         "sub": "mock-admin-id-1234",
#         "email": "admin@barkat.local",
#         "role": "admin"
#     }
