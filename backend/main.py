import sys
import os
# Ensure the backend/ directory is on sys.path so that imports like
# `from core.X` work whether uvicorn is run from the project root
# (uvicorn backend.main:app) or from inside backend/ (uvicorn main:app).
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from api.router import main_router

# Import database session and our models to ensure they are registered
from db.session import engine, Base
import models  # registers all models with Base.metadata (avoids shadowing core.config.settings)

# Auto-Create all database tables 
Base.metadata.create_all(bind=engine)

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Backend for the Smart Restaurant Software"
    )

    # CORS settings to allow frontend/mobile app requests
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], 
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include main API router tree
    app.include_router(main_router)

    return app

app = create_app()
