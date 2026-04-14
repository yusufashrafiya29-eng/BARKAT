import sys
import os
# Ensures backend/ is on sys.path so bare imports (core.X, api.X) work
# whether uvicorn runs from the project root or from inside backend/.
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from api.router import main_router

# Register all SQLAlchemy models with Base so create_all() picks them up.
# Using `import models` (not `from models import *`) avoids the models.settings
# submodule shadowing the core.config.settings object.
from db.session import engine, Base
import models

# Auto-create all database tables on startup
Base.metadata.create_all(bind=engine)

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Backend for the Smart Restaurant Software"
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

    @app.get("/", tags=["Health"])
    def root():
        return {"status": "BARKAT API is running 🔥"}

    return app

app = create_app()