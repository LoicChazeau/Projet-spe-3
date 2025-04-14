from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base
import os
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration de la base de données SQLite
DATABASE_URL = "sqlite:///optic_db.sqlite"

def get_engine():
    """
    Crée et retourne une instance du moteur de base de données.
    
    Returns:
        Engine: Instance du moteur SQLAlchemy
    """
    try:
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False},
            echo=True  # Active les logs SQL
        )
        logger.info(f"Connexion à la base de données établie avec succès: {DATABASE_URL}")
        return engine
    except Exception as e:
        logger.error(f"Erreur lors de la connexion à la base de données: {str(e)}")
        raise

def init_db():
    """
    Initialise la base de données en créant toutes les tables.
    """
    try:
        engine = get_engine()
        Base.metadata.create_all(bind=engine)
        logger.info("Tables créées avec succès")
    except Exception as e:
        logger.error(f"Erreur lors de la création des tables: {str(e)}")
        raise

# Création de la session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())

def get_db():
    """
    Fournit une session de base de données.
    
    Yields:
        Session: Session SQLAlchemy
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 