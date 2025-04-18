from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import numpy as np
import cv2
from typing import List
import logging
from ..models.recommendation import FaceAnalysis, GlassesRecommendation, RecommendationResponse
from ..services.recommendation_service import RecommendationService
from ..database.database import get_db
from ..database.models import Glasses, Category

router = APIRouter()
recommendation_service = RecommendationService()
logger = logging.getLogger(__name__)

@router.get("/glasses", response_model=List[GlassesRecommendation])
async def get_all_glasses(db: Session = Depends(get_db)):
    """Récupère toutes les lunettes disponibles."""
    try:
        glasses = db.query(Glasses).all()
        return [
            GlassesRecommendation(
                id=glass.id,
                ref=glass.ref,
                brand=glass.brand,
                model=glass.model,
                price=glass.price,
                description=glass.description,
                material=glass.material,
                size=glass.size,
                shape=glass.shape,
                categories=[category.name for category in glass.categories],
                colors=[color.name for color in glass.colors],
                recommended_face_shapes=[shape.name for shape in glass.recommended_face_shapes],
                images=[image.url for image in glass.images]
            )
            for glass in glasses
        ]
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des lunettes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/glasses/{category}", response_model=List[GlassesRecommendation])
async def get_glasses_by_category(category: str, db: Session = Depends(get_db)):
    """Récupère les lunettes d'une catégorie spécifique."""
    try:
        glasses = db.query(Glasses).join(Glasses.categories).filter(
            Glasses.categories.any(name=category)
        ).all()
        return [
            GlassesRecommendation(
                id=glass.id,
                ref=glass.ref,
                brand=glass.brand,
                model=glass.model,
                price=glass.price,
                description=glass.description,
                material=glass.material,
                size=glass.size,
                shape=glass.shape,
                categories=[category.name for category in glass.categories],
                colors=[color.name for color in glass.colors],
                recommended_face_shapes=[shape.name for shape in glass.recommended_face_shapes],
                images=[image.url for image in glass.images]
            )
            for glass in glasses
        ]
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des lunettes par catégorie: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommend", response_model=RecommendationResponse)
async def recommend_glasses(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Analyse un visage et recommande des lunettes adaptées."""
    try:
        # Lire l'image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Impossible de lire l'image")
        
        # Analyser le visage
        face_analysis = recommendation_service.analyze_face(image)
        
        # Générer les recommandations
        recommendations = recommendation_service.recommend_glasses(db, face_analysis)
        
        if not recommendations:
            return RecommendationResponse(
                success=False,
                message="Aucune recommandation trouvée pour cette forme de visage",
                face_analysis=face_analysis,
                recommendations=[]
            )
        
        return RecommendationResponse(
            success=True,
            message="Recommandations générées avec succès",
            face_analysis=face_analysis,
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération des recommandations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories", response_model=list[str])
def get_all_categories(db: Session = Depends(get_db)):
    """
    Récupère toutes les catégories disponibles.
    """
    try:
        categories = db.query(Category).all()
        return [category.name for category in categories]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 