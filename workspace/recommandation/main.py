from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.routers import recommendation

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Service de Recommandation de Lunettes",
    description="Service qui analyse la forme du visage et recommande des lunettes adaptées",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À modifier en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routers
app.include_router(recommendation.router, prefix="/api/v1/recommendation", tags=["Recommendation"])

@app.get("/", tags=["Health Check"])
def read_root():
    return {
        "status": "healthy",
        "service": "Recommendation API",
        "version": "1.0.0"
    }