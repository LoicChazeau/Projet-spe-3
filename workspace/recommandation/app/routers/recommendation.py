from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import numpy as np
import cv2
from ..models.recommendation import RecommendationResponse, GlassesRecommendation
from ..services.recommendation_service import RecommendationService
from database import get_db, Glasses, Style

router = APIRouter()
recommendation_service = RecommendationService()

@router.post("/analyze", response_model=RecommendationResponse)
async def analyze_face(
    file: UploadFile = File(..., description="Image du visage à analyser (format JPEG ou PNG)"),
    db: Session = Depends(get_db)
):
    """
    Analyse une image de visage et recommande des lunettes adaptées.
    """
    try:
        # Lire l'image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Analyser le visage
        face_analysis = recommendation_service.analyze_face(image)
        
        # Générer les recommandations
        recommendations = recommendation_service.recommend_glasses(face_analysis, db)
        
        return RecommendationResponse(
            success=True,
            message="Analyse et recommandations générées avec succès",
            face_analysis=face_analysis,
            recommendations=recommendations
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/glasses", response_model=list[GlassesRecommendation])
def get_all_glasses(db: Session = Depends(get_db)):
    """
    Récupère toutes les lunettes disponibles.
    """
    try:
        glasses = db.query(Glasses).all()
        return [
            GlassesRecommendation(
                type=f"Lunettes {glass.category}",
                brand=glass.brand,
                model=glass.model,
                image_url=glass.image_url,
                price=glass.price,
                description=glass.description,
                styles=[style.name for style in glass.styles]
            )
            for glass in glasses
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/glasses/{category}", response_model=list[GlassesRecommendation])
def get_glasses_by_category(category: str, db: Session = Depends(get_db)):
    """
    Récupère les lunettes par catégorie.
    """
    try:
        glasses = db.query(Glasses).filter(Glasses.category == category).all()
        return [
            GlassesRecommendation(
                type=f"Lunettes {glass.category}",
                brand=glass.brand,
                model=glass.model,
                image_url=glass.image_url,
                price=glass.price,
                description=glass.description,
                styles=[style.name for style in glass.styles]
            )
            for glass in glasses
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/styles", response_model=list[str])
def get_all_styles(db: Session = Depends(get_db)):
    """
    Récupère tous les styles disponibles.
    """
    try:
        styles = db.query(Style).all()
        return [style.name for style in styles]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 