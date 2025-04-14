from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import face_detection

app = FastAPI(
    title="Service Essayage",
    description="API pour l'essayage virtuel de lunettes avec détection faciale en temps réel",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # A modifier en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routers
app.include_router(face_detection.router, prefix="/api/v1/face", tags=["Face Detection"])

@app.get("/", tags=["Health Check"])
def read_root():
    return {
        "status": "healthy",
        "service": "Essayage API",
        "version": "1.0.0"
    }