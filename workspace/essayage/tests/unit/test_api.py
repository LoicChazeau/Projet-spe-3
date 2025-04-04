import pytest
from fastapi.testclient import TestClient
from app.main import app
import io
import cv2
import numpy as np

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def test_image():
    # Créer une image test
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.rectangle(img, (270, 180), (370, 300), (255, 255, 255), -1)
    
    # Convertir en bytes
    _, buffer = cv2.imencode('.jpg', img)
    return io.BytesIO(buffer.tobytes())

def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["service"] == "Essayage API"

def test_face_detection_endpoint_no_file(client):
    response = client.post("/api/v1/face/detect")
    assert response.status_code == 422  # Validation error

def test_face_detection_endpoint_with_file(client, test_image):
    files = {"image": ("test.jpg", test_image, "image/jpeg")}
    response = client.post("/api/v1/face/detect", files=files)
    assert response.status_code == 400  # Pas de visage détecté dans l'image test
    assert not response.json()["success"]

def test_face_detection_test_endpoint(client):
    response = client.get("/api/v1/face/test")
    assert response.status_code == 200
    assert "status" in response.json() 