from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Optical Factory Gateway")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# URLs des services
TRY_ON_SERVICE_URL = os.getenv("TRY_ON_SERVICE_URL", "http://essayage:8001")
RECOMMENDATION_SERVICE_URL = os.getenv("RECOMMENDATION_SERVICE_URL", "http://recommandation:8002")

class TryOnRequest(BaseModel):
    image: str
    frame_id: str

class RecommendationRequest(BaseModel):
    user_id: str
    preferences: dict

@app.get("/")
async def root():
    return {"message": "Optical Factory Gateway"}

@app.post("/try-on")
async def try_on(request: TryOnRequest):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{TRY_ON_SERVICE_URL}/try-on",
                json=request.dict()
            )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail="Service d'essayage indisponible")

@app.post("/recommendations")
async def get_recommendations(request: RecommendationRequest):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{RECOMMENDATION_SERVICE_URL}/recommendations",
                json=request.dict()
            )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail="Service de recommandation indisponible")