from pydantic import BaseModel, Field, validator
from typing import List, Optional
import numpy as np

class Point2D(BaseModel):
    x: float = Field(..., description="Coordonnée X du point")
    y: float = Field(..., description="Coordonnée Y du point")

    @validator('x', 'y')
    def check_finite(cls, v):
        if not np.isfinite(v):
            raise ValueError('Les coordonnées doivent être des nombres finis')
        return v

class Point3D(BaseModel):
    x: float = Field(..., description="Coordonnée X du point")
    y: float = Field(..., description="Coordonnée Y du point")
    z: float = Field(..., description="Coordonnée Z du point")

    @validator('x', 'y', 'z')
    def check_finite(cls, v):
        if not np.isfinite(v):
            raise ValueError('Les coordonnées doivent être des nombres finis')
        return v

class FaceLandmarks(BaseModel):
    landmarks: List[Point2D] = Field(..., description="Liste des points de repère du visage")
    image_width: int = Field(..., gt=0, description="Largeur de l'image")
    image_height: int = Field(..., gt=0, description="Hauteur de l'image")

    @validator('landmarks')
    def check_landmarks_count(cls, v):
        if len(v) < 10:  # Minimum de points requis pour une détection valide
            raise ValueError('Nombre insuffisant de points de repère détectés')
        return v

class GlassesPosition(BaseModel):
    position: Point3D = Field(..., description="Position des lunettes")
    rotation: Point3D = Field(..., description="Rotation des lunettes")
    scale: Point3D = Field(..., description="Échelle des lunettes")

    @validator('scale')
    def check_scale_positive(cls, v):
        if v.x <= 0 or v.y <= 0 or v.z <= 0:
            raise ValueError('Les valeurs d\'échelle doivent être positives')
        return v

class FaceAnalysisResponse(BaseModel):
    success: bool = Field(..., description="Indique si l'analyse a réussi")
    message: str = Field(..., description="Message décrivant le résultat")
    landmarks: Optional[FaceLandmarks] = Field(None, description="Points de repère du visage")
    glasses_position: Optional[GlassesPosition] = Field(None, description="Position des lunettes")

    @validator('landmarks', 'glasses_position')
    def check_optional_fields(cls, v, values):
        if values.get('success') and v is None:
            raise ValueError('Les champs landmarks et glasses_position sont requis lorsque success est True')
        return v 