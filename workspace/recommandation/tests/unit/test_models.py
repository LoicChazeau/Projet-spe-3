"""
Tests unitaires pour les modèles de données de recommandation.

Ce module contient les tests unitaires pour vérifier le bon fonctionnement
des modèles de données utilisés dans le service de recommandation.
"""

import pytest
from app.models.recommendation import FaceAnalysis, GlassesRecommendation, RecommendationResponse

def test_face_analysis_model():
    """Test la création et la validation du modèle FaceAnalysis."""
    # Test avec des données valides
    valid_data = {
        "face_shape": "ovale",
        "face_width": 150.0,
        "face_height": 180.0,
        "forehead_width": 140.0,
        "cheekbone_width": 160.0,
        "jaw_width": 130.0,
        "eye_distance": 60.0,
        "face_ratio": 0.83,
        "probabilities": {
            "ovale": 60,
            "rond": 20,
            "carré": 10,
            "rectangulaire": 10
        }
    }
    face_analysis = FaceAnalysis(**valid_data)
    assert face_analysis.face_shape == "ovale"
    assert face_analysis.face_width == 150.0
    assert face_analysis.face_height == 180.0
    assert face_analysis.forehead_width == 140.0
    assert face_analysis.cheekbone_width == 160.0
    assert face_analysis.jaw_width == 130.0
    assert face_analysis.eye_distance == 60.0
    assert face_analysis.face_ratio == 0.83
    assert face_analysis.probabilities == valid_data["probabilities"]
    assert sum(face_analysis.probabilities.values()) == 100

    # Test avec des données invalides
    invalid_data = {
        "face_shape": "ovale",
        "face_width": -150.0,  # Largeur négative
        "face_height": 180.0,
        "forehead_width": 140.0,
        "cheekbone_width": 160.0,
        "jaw_width": 130.0,
        "eye_distance": 60.0,
        "face_ratio": 0.83,
        "probabilities": {
            "ovale": 60,
            "rond": 20,
            "carré": 10,
            "rectangulaire": 10
        }
    }
    with pytest.raises(ValueError):
        FaceAnalysis(**invalid_data)

def test_glasses_recommendation_model():
    """Test la création et la validation du modèle GlassesRecommendation."""
    # Test avec des données valides
    valid_data = {
        "id": 1,
        "ref": "GL001",
        "brand": "Ray-Ban",
        "model": "RB3025",
        "price": 150.0,
        "description": "Lunettes de soleil classiques",
        "material": "Acétate",
        "size": "Adulte M",
        "shape": "Aviateur",
        "categories": ["Soleil", "Classique"],
        "colors": ["Noir", "Or"],
        "recommended_face_shapes": ["ovale", "carré"],
        "images": ["image1.jpg", "image2.jpg"],
        "compatibility_score": 0.85
    }
    recommendation = GlassesRecommendation(**valid_data)
    assert recommendation.id == 1
    assert recommendation.ref == "GL001"
    assert recommendation.brand == "Ray-Ban"
    assert recommendation.model == "RB3025"
    assert recommendation.price == 150.0
    assert recommendation.description == "Lunettes de soleil classiques"
    assert recommendation.material == "Acétate"
    assert recommendation.size == "Adulte M"
    assert recommendation.shape == "Aviateur"
    assert recommendation.categories == ["Soleil", "Classique"]
    assert recommendation.colors == ["Noir", "Or"]
    assert recommendation.recommended_face_shapes == ["ovale", "carré"]
    assert recommendation.images == ["image1.jpg", "image2.jpg"]
    assert recommendation.compatibility_score == 0.85

    # Test avec des données invalides
    invalid_data = {
        "id": 1,
        "ref": "GL001",
        "brand": "Ray-Ban",
        "model": "RB3025",
        "price": -150.0,  # Prix négatif
        "description": "Lunettes de soleil classiques",
        "material": "Acétate",
        "size": "Adulte M",
        "shape": "Aviateur",
        "categories": ["Soleil", "Classique"],
        "colors": ["Noir", "Or"],
        "recommended_face_shapes": ["ovale", "carré"],
        "images": ["image1.jpg", "image2.jpg"],
        "compatibility_score": 1.5  # Score > 1
    }
    with pytest.raises(ValueError):
        GlassesRecommendation(**invalid_data)

def test_recommendation_response_model():
    """Test la création et la validation du modèle RecommendationResponse."""
    # Test avec des données valides
    face_analysis = FaceAnalysis(
        face_shape="ovale",
        face_width=150.0,
        face_height=180.0,
        forehead_width=140.0,
        cheekbone_width=160.0,
        jaw_width=130.0,
        eye_distance=60.0,
        face_ratio=0.83
    )
    
    recommendation = GlassesRecommendation(
        id=1,
        ref="GL001",
        type="Lunettes Aviateur",
        brand="Ray-Ban",
        model="RB3025",
        price=150.0,
        description="Lunettes de soleil classiques",
        material="Acétate",
        size="Adulte M",
        shape="Aviateur",
        categories=["Soleil", "Classique"],
        colors=["Noir", "Or"],
        recommended_face_shapes=["ovale", "carré"],
        images=["image1.jpg", "image2.jpg"],
        compatibility_score=0.85
    )
    
    response = RecommendationResponse(
        success=True,
        message="Analyse réussie",
        face_analysis=face_analysis,
        recommendations=[recommendation]
    )
    
    assert response.success is True
    assert response.message == "Analyse réussie"
    assert response.face_analysis == face_analysis
    assert len(response.recommendations) == 1
    assert response.recommendations[0] == recommendation

    # Test avec des données invalides
    with pytest.raises(ValueError):
        RecommendationResponse(
            success=True,
            message="Analyse réussie",
            face_analysis=None,  # FaceAnalysis manquant
            recommendations=[recommendation]
        ) 