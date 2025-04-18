"""
Tests unitaires pour le service de recommandation.

Ce module contient les tests unitaires pour vérifier le bon fonctionnement
du service de recommandation. Les tests couvrent l'analyse de visage,
le calcul des scores de compatibilité et la génération de recommandations.
"""

import pytest
import cv2
import numpy as np
import os
from sqlalchemy.orm import Session
from app.services.recommendation_service import RecommendationService
from app.models.recommendation import FaceAnalysis, GlassesRecommendation
from app.database.models import Glasses

@pytest.fixture
def recommendation_service():
    """Crée une instance du service de recommandation."""
    return RecommendationService()

@pytest.fixture
def test_image():
    """Charge une image de test pour l'analyse de visage."""
    image_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'images-test', 'Ovale.png')
    image = cv2.imread(image_path)
    assert image is not None, f"L'image de test n'a pas pu être chargée depuis {image_path}"
    return image

@pytest.fixture
def mock_db():
    """Crée une session de base de données mockée."""
    class MockQuery:
        def __init__(self):
            self.all_result = []
        
        def all(self):
            return self.all_result
    
    class MockSession:
        def __init__(self):
            self.query = MockQuery()
    
    return MockSession()

def test_analyze_face(recommendation_service, test_image):
    """Teste l'analyse de visage."""
    analysis = recommendation_service.analyze_face(test_image)
    
    assert isinstance(analysis, FaceAnalysis)
    assert analysis.face_shape in ["rond", "ovale", "carré", "rectangulaire"]
    assert analysis.probabilities is not None
    assert sum(analysis.probabilities.values()) == 100

def test_calculate_compatibility_score(recommendation_service):
    """Teste le calcul du score de compatibilité."""
    analysis = FaceAnalysis(
        face_shape="ovale",
        probabilities={"rond": 20, "ovale": 60, "carré": 10, "rectangulaire": 10},
        face_width=150.0,
        face_height=180.0,
        forehead_width=140.0,
        cheekbone_width=160.0,
        jaw_width=130.0,
        eye_distance=60.0,
        face_ratio=0.83,
        face_landmarks={},
        face_contour=[]
    )
    
    glasses_data = {
        "id": 1,
        "ref": "REF001",
        "shape": "rond",
        "material": "acétate",
        "size": "M",
        "colors": ["noir", "rouge"],
        "recommended_face_shapes": ["rond", "ovale"],
        "images": ["image1.jpg", "image2.jpg"]
    }
    
    score = recommendation_service.calculate_compatibility_score(analysis, glasses_data)
    assert isinstance(score, float)
    assert 0 <= score <= 100 