from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import face_detection

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifiez les origines exactes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routes
app.include_router(face_detection.router, prefix="/api/v1/face", tags=["face"])

@app.get("/")
async def root():
    return {"message": "Face Detection API"} 