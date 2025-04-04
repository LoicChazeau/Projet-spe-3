from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from ..models.face import FaceLandmarks, FaceAnalysisResponse, GlassesPosition
from ..services.face_detector import FaceDetectorService

router = APIRouter()
face_detector = FaceDetectorService()

@router.post("/detect", response_model=FaceAnalysisResponse)
async def detect_face_landmarks(image: UploadFile = File(...)):
    """
    Détecte les points de repère du visage et calcule la position optimale des lunettes.
    """
    try:
        landmarks, glasses_position = await face_detector.detect_landmarks(image)
        return FaceAnalysisResponse(
            success=True,
            message="Face landmarks and glasses position calculated successfully",
            landmarks=landmarks,
            glasses_position=glasses_position
        )
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": str(e),
                "landmarks": None,
                "glasses_position": None
            }
        )

@router.get("/test")
async def test_face_detection():
    """
    Endpoint de test pour vérifier que le service de détection fonctionne.
    """
    return {"status": "Face detection service is running"} 