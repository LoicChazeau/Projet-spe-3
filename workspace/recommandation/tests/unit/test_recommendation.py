"""
Tests unitaires pour la génération de recommandations.

Ce module contient les tests unitaires pour vérifier le bon fonctionnement
de la génération de recommandations de lunettes. Les tests vérifient que
les recommandations sont cohérentes avec la forme du visage détectée.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.services.recommendation_service import RecommendationService
from app.models.recommendation import FaceAnalysis
from database import Base, Glasses, Style

@pytest.fixture
def recommendation_service():
    return RecommendationService()

@pytest.fixture
def db_session():
    """Crée une session de base de données pour les tests."""
    # Créer une base de données en mémoire pour les tests
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Ajouter des données de test
    style1 = Style(name="classique")
    style2 = Style(name="moderne")
    session.add_all([style1, style2])
    
    glasses1 = Glasses(
        brand="TestBrand1",
        model="Model1",
        image_url="http://test.com/1.jpg",
        category="rondes",
        price=100.0,
        description="Lunettes rondes de test"
    )
    glasses1.styles.append(style1)
    
    glasses2 = Glasses(
        brand="TestBrand2",
        model="Model2",
        image_url="http://test.com/2.jpg",
        category="rectangulaires",
        price=150.0,
        description="Lunettes rectangulaires de test"
    )
    glasses2.styles.append(style2)
    
    session.add_all([glasses1, glasses2])
    session.commit()
    
    yield session
    
    session.close()

def test_recommend_glasses_for_round_face(recommendation_service, db_session):
    """Test les recommandations pour un visage rond."""
    face_analysis = FaceAnalysis(
        face_shape="rond",
        face_width=200,
        face_height=200
    )
    
    recommendations = recommendation_service.recommend_glasses(face_analysis, db_session)
    
    # Vérifier que les recommandations sont pour des lunettes rectangulaires
    assert all("rectangulaires" in rec.type for rec in recommendations)
    assert len(recommendations) > 0

def test_recommend_glasses_for_rectangular_face(recommendation_service, db_session):
    """Test les recommandations pour un visage rectangulaire."""
    face_analysis = FaceAnalysis(
        face_shape="rectangulaire",
        face_width=200,
        face_height=300
    )
    
    recommendations = recommendation_service.recommend_glasses(face_analysis, db_session)
    
    # Vérifier que les recommandations sont pour des lunettes rondes
    assert all("rondes" in rec.type for rec in recommendations)
    assert len(recommendations) > 0

def test_recommend_glasses_for_unknown_shape(recommendation_service, db_session):
    """Test les recommandations pour une forme de visage inconnue."""
    face_analysis = FaceAnalysis(
        face_shape="inconnue",
        face_width=200,
        face_height=200
    )
    
    recommendations = recommendation_service.recommend_glasses(face_analysis, db_session)
    
    # Vérifier que les recommandations sont pour des lunettes classiques
    assert all("classiques" in rec.type for rec in recommendations)
    assert len(recommendations) > 0 