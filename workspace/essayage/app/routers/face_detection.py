from fastapi import APIRouter, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from ..models.face import FaceLandmarks, FaceAnalysisResponse, GlassesPosition
from ..services.face_detector import FaceDetectorService
import base64
import numpy as np
import cv2
import json

router = APIRouter()
face_detector = FaceDetectorService()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await websocket.accept()
        while True:
            try:
                # Recevoir l'image en base64 du client
                data = await websocket.receive_text()
                
                try:
                    # Décoder l'image base64
                    img_data = base64.b64decode(data.split(',')[1])
                    nparr = np.frombuffer(img_data, np.uint8)
                    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    
                    # Détecter les landmarks
                    landmarks, glasses_position = face_detector.process_image(img)
                    
                    # Envoyer les résultats
                    await websocket.send_json({
                        "success": True,
                        "landmarks": landmarks.dict(),
                        "glasses_position": glasses_position.dict()
                    })
                    
                except Exception as e:
                    print(f"Error processing image: {e}")
                    await websocket.send_json({
                        "success": False,
                        "error": str(e)
                    })
                    
            except WebSocketDisconnect:
                print("Client disconnected")
                break
                
    except Exception as e:
        print(f"WebSocket error: {e}")

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