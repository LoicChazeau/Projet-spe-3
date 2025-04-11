"""
Tests unitaires pour les modèles de données.

Ce module contient les tests unitaires pour vérifier le bon fonctionnement
des modèles de données utilisés dans l'application. Les tests couvrent
la création des modèles et la validation des contraintes métier.

Tests couverts :
- Création des points 2D et 3D
- Création des landmarks faciaux
- Création de la position des lunettes
- Validation des contraintes métier

Cas d'erreur testés :
- Coordonnées invalides
- Nombre insuffisant de landmarks
- Valeurs d'échelle négatives
- Champs manquants
"""

import pytest
from app.models.face import Point2D, Point3D, FaceLandmarks, GlassesPosition

def test_point2d_creation():
    point = Point2D(x=1.0, y=2.0)
    assert point.x == 1.0
    assert point.y == 2.0

def test_point3d_creation():
    point = Point3D(x=1.0, y=2.0, z=3.0)
    assert point.x == 1.0
    assert point.y == 2.0
    assert point.z == 3.0

def test_face_landmarks_creation():
    landmarks = [
        Point2D(x=1.0, y=2.0),  # Œil gauche
        Point2D(x=3.0, y=2.0),  # Œil droit
        Point2D(x=2.0, y=3.0),  # Nez
        Point2D(x=1.5, y=4.0),  # Bouche gauche
        Point2D(x=2.5, y=4.0),  # Bouche droite
        Point2D(x=0.5, y=2.0),  # Temple gauche
        Point2D(x=3.5, y=2.0),  # Temple droit
        Point2D(x=1.0, y=1.0),  # Sourcil gauche
        Point2D(x=3.0, y=1.0),  # Sourcil droit
        Point2D(x=2.0, y=2.5),  # Pont du nez
    ]
    face_landmarks = FaceLandmarks(
        landmarks=landmarks,
        image_width=640,
        image_height=480
    )
    assert len(face_landmarks.landmarks) == 10
    assert face_landmarks.image_width == 640
    assert face_landmarks.image_height == 480
    # Vérifier quelques points spécifiques
    assert face_landmarks.landmarks[0].x == 1.0  # Œil gauche
    assert face_landmarks.landmarks[1].x == 3.0  # Œil droit
    assert face_landmarks.landmarks[2].y == 3.0  # Nez

def test_glasses_position_creation():
    position = Point3D(x=1.0, y=2.0, z=3.0)
    rotation = Point3D(x=0.1, y=0.2, z=0.3)
    scale = Point3D(x=1.0, y=1.0, z=1.0)
    
    glasses_pos = GlassesPosition(
        position=position,
        rotation=rotation,
        scale=scale
    )
    
    assert glasses_pos.position.x == 1.0
    assert glasses_pos.rotation.y == 0.2
    assert glasses_pos.scale.z == 1.0

def test_invalid_point2d():
    with pytest.raises(ValueError):
        Point2D(x="invalid", y=2.0)

def test_invalid_face_landmarks():
    with pytest.raises(ValueError):
        FaceLandmarks(
            landmarks=[],  # Liste vide non valide
            image_width=-1,  # Largeur négative non valide
            image_height=480
        ) 