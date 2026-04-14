import sys
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import ValidationError

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Restaurant Software API"
    VERSION: str = "1.0.0"
    
    SUPABASE_URL: str
    SUPABASE_KEY: str
    DATABASE_URL: str
    JWT_SECRET: str
    
    WHATSAPP_API_URL: str = ""
    WHATSAPP_API_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

try:
    settings = Settings()
except ValidationError as e:
    print("\n" + "="*60)
    print("❌  STARTUP FAILED: Missing required environment variables")
    print("="*60)
    for error in e.errors():
        field = " -> ".join(str(x) for x in error["loc"])
        print(f"  • {field}: {error['msg']}")
    print("\nSet these in your Render dashboard → Environment tab:")
    print("  DATABASE_URL, JWT_SECRET, SUPABASE_URL, SUPABASE_KEY")
    print("="*60 + "\n")
    sys.exit(1)
