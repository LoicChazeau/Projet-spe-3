from pydantic import BaseModel, Field, validator
from typing import List, Optional

class FaceAnalysis(BaseModel):
    face_shape: str = Field(..., description="Forme du visage détectée")
    face_width: float = Field(..., gt=0, description="Largeur du visage en pixels")
    face_height: float = Field(..., gt=0, description="Hauteur du visage en pixels")
    forehead_width: float = Field(..., gt=0, description="Largeur du front en pixels")
    cheekbone_width: float = Field(..., gt=0, description="Largeur des pommettes en pixels")
    jaw_width: float = Field(..., gt=0, description="Largeur de la mâchoire en pixels")
    eye_distance: float = Field(..., gt=0, description="Distance entre les yeux en pixels")
    face_ratio: float = Field(..., gt=0, description="Ratio largeur/hauteur du visage")
    probabilities: Optional[dict] = Field(None, description="Probabilités pour chaque forme de visage")

    @validator('face_shape')
    def validate_face_shape(cls, v):
        valid_shapes = ['ovale', 'rond', 'carré', 'rectangulaire']
        if v not in valid_shapes:
            raise ValueError(f"Forme de visage invalide. Doit être l'un des suivants: {valid_shapes}")
        return v

    @validator('probabilities')
    def validate_probabilities(cls, v):
        if v is not None:
            valid_shapes = ['ovale', 'rond', 'carré', 'rectangulaire']
            for shape in v:
                if shape not in valid_shapes:
                    raise ValueError(f"Forme de visage invalide dans les probabilités: {shape}")
                if not 0 <= v[shape] <= 100:
                    raise ValueError(f"Probabilité invalide pour {shape}: {v[shape]}. Doit être entre 0 et 100")
        return v

class GlassesRecommendation(BaseModel):
    id: int = Field(..., gt=0, description="Identifiant unique des lunettes")
    ref: str = Field(..., min_length=1, description="Référence des lunettes")
    brand: str = Field(..., min_length=1, description="Marque des lunettes")
    model: str = Field(..., min_length=1, description="Modèle des lunettes")
    price: float = Field(..., gt=0, description="Prix des lunettes")
    description: Optional[str] = Field(None, description="Description des lunettes")
    material: Optional[str] = Field(None, description="Matériau des lunettes")
    size: Optional[str] = Field(None, description="Taille des lunettes")
    shape: str = Field(..., min_length=1, description="Forme des lunettes")
    categories: List[str] = Field(..., min_items=1, description="Catégories des lunettes")
    colors: List[str] = Field(..., min_items=1, description="Couleurs disponibles")
    recommended_face_shapes: List[str] = Field(..., min_items=1, description="Formes de visage recommandées")
    images: List[str] = Field(..., min_items=1, description="URLs des images")
    compatibility_score: Optional[float] = Field(None, ge=0, le=100, description="Score de compatibilité (0-100)")

    @validator('price')
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError("Le prix doit être positif")
        return v

    @validator('compatibility_score')
    def validate_compatibility_score(cls, v):
        if v is not None and not 0 <= v <= 100:
            raise ValueError("Le score de compatibilité doit être entre 0 et 100")
        return v

class RecommendationResponse(BaseModel):
    success: bool = Field(..., description="Indique si la recommandation a réussi")
    message: str = Field(..., min_length=1, description="Message de statut")
    face_analysis: FaceAnalysis = Field(..., description="Analyse du visage")
    recommendations: List[GlassesRecommendation] = Field(default_factory=list, description="Liste des recommandations") 