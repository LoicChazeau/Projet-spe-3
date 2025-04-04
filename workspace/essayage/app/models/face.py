from pydantic import BaseModel
from typing import List, Optional

class Point2D(BaseModel):
    x: float
    y: float

class Point3D(BaseModel):
    x: float
    y: float
    z: float

class FaceLandmarks(BaseModel):
    landmarks: List[Point2D]
    image_width: int
    image_height: int

class GlassesPosition(BaseModel):
    position: Point3D
    rotation: Point3D
    scale: Point3D

class FaceAnalysisResponse(BaseModel):
    success: bool
    message: str
    landmarks: Optional[FaceLandmarks] = None
    glasses_position: Optional[GlassesPosition] = None 