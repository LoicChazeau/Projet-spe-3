from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
import os
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration de la base de données SQLite
DATABASE_URL = "sqlite:///./optic_db.sqlite"

try:
    # Création du moteur de base de données
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=True  # Active les logs SQL
    )
    logger.info(f"Connexion à la base de données établie avec succès: {DATABASE_URL}")
except Exception as e:
    logger.error(f"Erreur lors de la connexion à la base de données: {str(e)}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Table de liaison pour les styles
glasses_styles = Table('glasses_styles', Base.metadata,
    Column('glasses_id', Integer, ForeignKey('glasses.id')),
    Column('style_id', Integer, ForeignKey('styles.id'))
)

class Glasses(Base):
    __tablename__ = "glasses"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
    image_url = Column(String, nullable=False)
    category = Column(String, nullable=False)  # rectangulaires, rondes, ovales, carrées
    price = Column(Float, nullable=False)
    description = Column(String)
    styles = relationship("Style", secondary=glasses_styles, back_populates="glasses")

class Style(Base):
    __tablename__ = "styles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    glasses = relationship("Glasses", secondary=glasses_styles, back_populates="styles")

try:
    # Création des tables
    Base.metadata.create_all(bind=engine)
    logger.info("Tables créées avec succès")
except Exception as e:
    logger.error(f"Erreur lors de la création des tables: {str(e)}")
    raise

# Fonction pour obtenir une session de base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 