"""
Tests unitaires pour la détection de forme de visage.

Ce module contient les tests unitaires pour vérifier le bon fonctionnement
de la détection de forme de visage. Les tests utilisent des images de test
pour vérifier la détection des différentes formes de visage.
"""

import pytest
import cv2
import numpy as np
import os
from app.services.recommendation_service import RecommendationService
from app.models.recommendation import FaceAnalysis

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

def test_detect_rectangular_face(recommendation_service):
    """Teste la détection d'un visage rectangulaire."""
    image_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'images-test', 'Rectangle.png')
    image = cv2.imread(image_path)
    assert image is not None, f"L'image rectangulaire n'a pas pu être chargée depuis {image_path}"
    
    analysis = recommendation_service.analyze_face(image)
    assert analysis.face_shape == "rectangulaire"
    assert analysis.probabilities["rectangulaire"] > 30

def test_detect_oval_face(recommendation_service):
    """Teste la détection d'un visage ovale."""
    image_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'images-test', 'Ovale.png')
    image = cv2.imread(image_path)
    assert image is not None, f"L'image ovale n'a pas pu être chargée depuis {image_path}"
    
    analysis = recommendation_service.analyze_face(image)
    assert analysis.face_shape == "ovale"
    assert analysis.probabilities["ovale"] > 30

def test_face_shape_detection(recommendation_service, test_image):
    """Teste la détection de la forme du visage."""
    analysis = recommendation_service.analyze_face(test_image)
    
    assert isinstance(analysis, FaceAnalysis)
    assert analysis.face_shape in ["rond", "ovale", "carré", "rectangulaire"]
    assert analysis.probabilities is not None
    assert sum(analysis.probabilities.values()) == 100

def test_no_face_detection(recommendation_service):
    """Teste le cas où aucun visage n'est détecté."""
    # Créer une image noire (sans visage)
    image = np.zeros((100, 100, 3), dtype=np.uint8)
    
    with pytest.raises(ValueError, match="Aucun visage détecté dans l'image"):
        recommendation_service.analyze_face(image) 