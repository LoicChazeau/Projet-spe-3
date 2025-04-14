from pydantic import BaseModel
from typing import List, Optional

class FaceAnalysis(BaseModel):
    face_shape: str
    face_width: int
    face_height: int
    probabilities: Optional[dict] = None

class GlassesRecommendation(BaseModel):
    type: str
    brand: str
    model: str
    image_url: str
    price: float
    description: Optional[str] = None
    styles: List[str]

class RecommendationResponse(BaseModel):
    success: bool
    message: str
    face_analysis: FaceAnalysis
    recommendations: List[GlassesRecommendation] 