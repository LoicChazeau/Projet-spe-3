import pytest
import numpy as np
from fastapi import UploadFile
from app.services.face_detector import FaceDetectorService
from app.models.face import Point2D, Point3D, FaceLandmarks, GlassesPosition
import io
import cv2

@pytest.fixture
def face_detector():
    return FaceDetectorService()

@pytest.fixture
def mock_image():
    # Créer une image test avec un visage simple (rectangle blanc sur fond noir)
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    # Dessiner un rectangle blanc pour simuler un visage
    cv2.rectangle(img, (270, 180), (370, 300), (255, 255, 255), -1)
    
    # Convertir l'image en bytes
    _, buffer = cv2.imencode('.jpg', img)
    io_buf = io.BytesIO(buffer)
    
    return UploadFile(filename='test.jpg', file=io_buf)

@pytest.mark.asyncio
async def test_face_detector_initialization(face_detector):
    assert face_detector.face_mesh is not None

@pytest.mark.asyncio
async def test_calculate_glasses_position(face_detector):
    # Créer des landmarks simulés
    class MockLandmark:
        def __init__(self, x, y, z):
            self.x = x
            self.y = y
            self.z = z
    
    mock_landmarks = [MockLandmark(0, 0, 0)] * 468
    # Définir les points des yeux
    mock_landmarks[33] = MockLandmark(0.3, 0.4, 0.0)  # Œil gauche
    mock_landmarks[263] = MockLandmark(0.7, 0.4, 0.0)  # Œil droit
    mock_landmarks[1] = MockLandmark(0.5, 0.6, 0.1)  # Nez
    
    # Calculer la position des lunettes
    glasses_position = face_detector._calculate_glasses_position(
        mock_landmarks,
        width=640,
        height=480
    )
    
    # Vérifier que la position est cohérente
    assert isinstance(glasses_position, GlassesPosition)
    assert 0.4 < glasses_position.position.x / 640 < 0.6  # Position X centrée
    assert 0.3 < glasses_position.position.y / 480 < 0.5  # Position Y près des yeux
    assert glasses_position.scale.x > 0  # Échelle positive

@pytest.mark.asyncio
async def test_detect_landmarks_no_face(face_detector, mock_image):
    # Test avec une image sans visage clair
    with pytest.raises(ValueError) as exc_info:
        await face_detector.detect_landmarks(mock_image)
    assert "No face detected" in str(exc_info.value) 