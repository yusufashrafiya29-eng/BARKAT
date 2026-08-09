import sys
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import ValidationError, field_validator
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Restaurant Software API"
    VERSION: str = "1.0.0"
    
    SUPABASE_URL: str
    SUPABASE_KEY: str
    DATABASE_URL: str
    JWT_SECRET: str
    
    WHATSAPP_API_URL: str = ""
    WHATSAPP_API_KEY: str = ""
    BASE_URL: str = "http://localhost:8000"
    RAZORPAY_WEBHOOK_SECRET: str = ""
    TRIPO_API_KEY: str = ""
    MESHY_API_KEY: str = ""
    
    SAAS_RAZORPAY_KEY_ID: str = ""
    SAAS_RAZORPAY_KEY_SECRET: str = ""
    
    # CORS: set ALLOWED_ORIGINS in Render env as a JSON list, e.g.:
    # ["https://your-frontend.onrender.com","https://yourdomain.com"]
    # Leave as ["*"] for local development only
    ALLOWED_ORIGINS: List[str] = ["*"]
    
    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except Exception:
                return [o.strip() for o in v.split(",")]
        return v

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

try:
    settings = Settings()
except ValidationError as e:
    print("\n" + "="*60)
    print("! STARTUP FAILED: Missing required environment variables")
    print("="*60)
    for error in e.errors():
        field = " -> ".join(str(x) for x in error["loc"])
        print(f"  * {field}: {error['msg']}")
    print("\nSet these in your Render dashboard -> Environment tab:")
    print("  DATABASE_URL, JWT_SECRET, SUPABASE_URL, SUPABASE_KEY")
    print("="*60 + "\n")
    sys.exit(1)
