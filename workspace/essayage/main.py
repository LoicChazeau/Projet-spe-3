import cv2
import numpy as np
import mediapipe as mp
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import base64
from typing import List, Dict
import json

app = FastAPI(title="Optical Factory Try-On Service")

# Initialisation de MediaPipe Face Detection
mp_face_detection = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils

class TryOnRequest(BaseModel):
    image: str  # Image en base64
    frame_id: str

class TryOnResponse(BaseModel):
    result_image: str
    face_landmarks: Dict
    success: bool
    message: str

def decode_image(base64_string: str) -> np.ndarray:
    try:
        image_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur de décodage de l'image: {str(e)}")

def encode_image(image: np.ndarray) -> str:
    _, buffer = cv2.imencode('.jpg', image)
    return base64.b64encode(buffer).decode('utf-8')

@app.post("/try-on", response_model=TryOnResponse)
async def try_on(request: TryOnRequest):
    try:
        # Décodage de l'image
        image = decode_image(request.image)
        
        # Conversion en RGB pour MediaPipe
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Détection des visages
        with mp_face_detection.FaceDetection(
            model_selection=1, min_detection_confidence=0.5) as face_detection:
            
            results = face_detection.process(image_rgb)
            
            if not results.detections:
                return TryOnResponse(
                    result_image=encode_image(image),
                    face_landmarks={},
                    success=False,
                    message="Aucun visage détecté"
                )
            
            # Dessin des détections
            annotated_image = image.copy()
            face_landmarks = {}
            
            for idx, detection in enumerate(results.detections):
                mp_drawing.draw_detection(annotated_image, detection)
                
                # Extraction des points clés
                bbox = detection.location_data.relative_bounding_box
                keypoints = detection.location_data.relative_keypoints
                
                face_landmarks[f"face_{idx}"] = {
                    "bbox": {
                        "x": float(bbox.xmin),
                        "y": float(bbox.ymin),
                        "width": float(bbox.width),
                        "height": float(bbox.height)
                    },
                    "keypoints": [
                        {"x": float(kp.x), "y": float(kp.y)}
                        for kp in keypoints
                    ]
                }
        
        return TryOnResponse(
            result_image=encode_image(annotated_image),
            face_landmarks=face_landmarks,
            success=True,
            message="Visage(s) détecté(s) avec succès"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}