import sys
import os
import logging
from contextlib import asynccontextmanager

# Ensures backend/ is on sys.path so bare imports (core.X, api.X) work
# whether uvicorn runs from the project root or from inside backend/.
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from core.config import settings
from api.router import main_router

# Register all SQLAlchemy models with Base so create_all() picks them up.
from db.session import engine, Base, SessionLocal
import models

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run DB table creation on startup — but don't crash if DB is unreachable."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables verified/created.")
        
        # Initialize default platform config
        with SessionLocal() as db:
            from models.settings import PlatformConfig
            defaults = [
                ("trial_days_length", "14", "Duration of free trial in days"),
                ("basic_plan_price", "499", "Monthly price for Basic plan"),
                ("pro_plan_price", "999", "Monthly price for Pro plan"),
                ("max_plan_price", "1399", "Monthly price for Max plan"),
                ("platform_upi_id", "9979114665@kotak811", "UPI ID for platform payments")
            ]
            for key, val, desc in defaults:
                if not db.query(PlatformConfig).filter(PlatformConfig.key == key).first():
                    db.add(PlatformConfig(key=key, value=val, description=desc))
            db.commit()
            logger.info("✅ Platform defaults verified.")
            
    except Exception as e:
        logger.warning(f"⚠️  Could not connect to database on startup: {e}")
        logger.warning("App will still start — DB errors will occur on first request.")
    yield  # App runs here

# Ensure static directory exists before mounting
os.makedirs("static", exist_ok=True)

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Backend for the Smart Restaurant Software",
        lifespan=lifespan,
    )

    # CORS — allow all origins for now (tighten in production)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount the full API router tree (all endpoints live under /api/v1/...)
    app.include_router(main_router)

    # Static files for logos
    app.mount("/static", StaticFiles(directory="static"), name="static")

    @app.get("/", tags=["Health"])
    def root():
        return {"status": "MyRestro API is running 🔥"}

    return app

app = create_app()