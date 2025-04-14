"""
Tests unitaires pour la détection de forme de visage.

Ce module contient les tests unitaires pour vérifier le bon fonctionnement
de la détection de forme de visage. Les tests utilisent des images de test
pour vérifier la détection des différentes formes de visage.
"""

import pytest
import cv2
import numpy as np
from app.services.recommendation_service import RecommendationService

@pytest.fixture
def recommendation_service():
    return RecommendationService()

@pytest.fixture
def test_images():
    """Charge les images de test pour les différentes formes de visage."""
    images = {}
    shapes = ['rond', 'ovale', 'carre', 'rectangulaire']
    for shape in shapes:
        image_path = f"Images test/{shape.capitalize()}.png"
        image = cv2.imread(image_path)
        if image is not None:
            images[shape] = image
    return images

def test_face_shape_detection(recommendation_service, test_images):
    """Test la détection de forme de visage sur les images de test."""
    for expected_shape, image in test_images.items():
        # Analyser le visage
        face_analysis = recommendation_service.analyze_face(image)
        
        # Vérifier que la forme détectée correspond à la forme attendue
        assert face_analysis.face_shape == expected_shape, \
            f"Forme attendue: {expected_shape}, Forme détectée: {face_analysis.face_shape}"

def test_face_shape_probabilities(recommendation_service):
    """Test le calcul des probabilités de forme de visage."""
    # Test avec des valeurs typiques pour un visage rond
    probabilities = recommendation_service.calculate_face_shape_probabilities(
        aspect_ratio=1.0,  # Ratio proche de 1
        circularity=0.085,  # Circularité typique d'un visage rond
        convexity=0.6  # Bonne convexité
    )
    
    # Vérifier que la probabilité la plus élevée est pour "rond"
    assert max(probabilities.items(), key=lambda x: x[1])[0] == "rond"
    
    # Vérifier que la somme des probabilités est proche de 100%
    assert abs(sum(probabilities.values()) - 100) < 0.1

def test_invalid_image(recommendation_service):
    """Test la gestion d'une image invalide."""
    # Créer une image invalide (noire)
    invalid_image = np.zeros((100, 100, 3), dtype=np.uint8)
    
    # Vérifier que l'analyse lève une exception
    with pytest.raises(ValueError) as exc_info:
        recommendation_service.analyze_face(invalid_image)
    assert "Aucun visage détecté" in str(exc_info.value) 