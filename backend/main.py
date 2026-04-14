from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"status": "working"}
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Backend for the Smart Restaurant Software"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], 
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    def root():
        return {"status": "config working"}

    return app

app = create_app()
