"""
Tests unitaires pour l'API de détection faciale.

Ce module contient les tests unitaires pour vérifier le bon fonctionnement
des endpoints de l'API. Les tests couvrent les fonctionnalités principales
et les cas d'erreur.

Tests couverts :
- Endpoint racine (GET /)
- Endpoint de détection de visage (POST /api/v1/face/detect)
- Endpoint de test (GET /api/v1/face/test)
- Endpoint WebSocket (/api/v1/face/ws)

Cas d'erreur testés :
- Requête sans fichier image
- Image sans visage détecté
- Connexion WebSocket invalide
"""

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
    assert response.json()["message"] == "Face Detection API"

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

def test_websocket_endpoint_accessible(client):
    """
    Test simple pour vérifier que l'endpoint WebSocket est accessible.
    """
    with client.websocket_connect("/api/v1/face/ws") as websocket:
        # Vérifier que la connexion est établie en envoyant un message
        websocket.send_text("test")
        response = websocket.receive_json()
        assert "success" in response 