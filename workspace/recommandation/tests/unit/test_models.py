"""
Tests unitaires pour les modèles de données.

Ce module contient les tests unitaires pour vérifier le bon fonctionnement
des modèles de données utilisés dans le service de recommandation.
"""

import pytest
from app.models.recommendation import FaceAnalysis, GlassesRecommendation, RecommendationResponse

def test_face_analysis_model():
    """Test la création et la validation du modèle FaceAnalysis."""
    # Test avec des données valides
    face_analysis = FaceAnalysis(
        face_shape="rond",
        face_width=200,
        face_height=200
    )
    
    assert face_analysis.face_shape == "rond"
    assert face_analysis.face_width == 200
    assert face_analysis.face_height == 200
    
    # Test avec des données invalides
    with pytest.raises(ValueError):
        FaceAnalysis(
            face_shape="rond",
            face_width=-100,  # Largeur négative invalide
            face_height=200
        )

def test_glasses_recommendation_model():
    """Test la création et la validation du modèle GlassesRecommendation."""
    # Test avec des données valides
    recommendation = GlassesRecommendation(
        type="Lunettes rondes",
        brand="TestBrand",
        model="TestModel",
        image_url="http://test.com/image.jpg",
        price=100.0,
        description="Description de test",
        styles=["classique", "moderne"]
    )
    
    assert recommendation.type == "Lunettes rondes"
    assert recommendation.brand == "TestBrand"
    assert recommendation.price == 100.0
    assert len(recommendation.styles) == 2
    
    # Test avec des données invalides
    with pytest.raises(ValueError):
        GlassesRecommendation(
            type="Lunettes rondes",
            brand="TestBrand",
            model="TestModel",
            image_url="http://test.com/image.jpg",
            price=-100.0,  # Prix négatif invalide
            styles=["classique"]
        )

def test_recommendation_response_model():
    """Test la création et la validation du modèle RecommendationResponse."""
    # Créer une analyse de visage
    face_analysis = FaceAnalysis(
        face_shape="rond",
        face_width=200,
        face_height=200
    )
    
    # Créer une recommandation
    recommendation = GlassesRecommendation(
        type="Lunettes rondes",
        brand="TestBrand",
        model="TestModel",
        image_url="http://test.com/image.jpg",
        price=100.0,
        styles=["classique"]
    )
    
    # Test avec des données valides
    response = RecommendationResponse(
        success=True,
        message="Test réussi",
        face_analysis=face_analysis,
        recommendations=[recommendation]
    )
    
    assert response.success is True
    assert response.message == "Test réussi"
    assert response.face_analysis.face_shape == "rond"
    assert len(response.recommendations) == 1
    assert response.recommendations[0].type == "Lunettes rondes" 