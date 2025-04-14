from sqlalchemy import Column, Integer, String, Float, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()

# Tables de liaison
glasses_face_shapes = Table('glasses_face_shapes', Base.metadata,
    Column('glasses_id', Integer, ForeignKey('glasses.id')),
    Column('face_shape_id', Integer, ForeignKey('face_shapes.id'))
)

glasses_colors = Table('glasses_colors', Base.metadata,
    Column('glasses_id', Integer, ForeignKey('glasses.id')),
    Column('color_id', Integer, ForeignKey('colors.id'))
)

glasses_categories = Table('glasses_categories', Base.metadata,
    Column('glasses_id', Integer, ForeignKey('glasses.id')),
    Column('category_id', Integer, ForeignKey('categories.id'))
)

class Glasses(Base):
    """
    Modèle représentant une paire de lunettes dans la base de données.
    
    Attributes:
        id (int): Identifiant unique de la paire de lunettes
        ref (str): Référence unique du produit
        brand (str): Marque des lunettes
        model (str): Modèle des lunettes
        price (float): Prix de base des lunettes
        description (str): Description détaillée des lunettes
        material (str): Matériau de la monture
        size (str): Taille de la monture
        shape (str): Forme de la monture
        recommended_face_shapes (list): Liste des formes de visage recommandées
        images (list): Liste des images associées
        colors (list): Liste des couleurs disponibles
        categories (list): Liste des catégories
    """
    __tablename__ = "glasses"
    
    id = Column(Integer, primary_key=True, index=True)
    ref = Column(String, unique=True, nullable=False)
    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    description = Column(String)
    material = Column(String)
    size = Column(String)
    shape = Column(String)
    
    # Relations
    recommended_face_shapes = relationship("FaceShape", secondary=glasses_face_shapes)
    images = relationship("Image", back_populates="glasses")
    colors = relationship("Color", secondary=glasses_colors)
    categories = relationship("Category", secondary=glasses_categories)

class Image(Base):
    """
    Modèle représentant une image de lunettes.
    
    Attributes:
        id (int): Identifiant unique de l'image
        url (str): URL de l'image
        view_type (str): Type de vue (front, side, etc.)
        glasses_id (int): ID des lunettes associées
    """
    __tablename__ = "images"
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, nullable=False)
    view_type = Column(String)
    glasses_id = Column(Integer, ForeignKey("glasses.id"))
    glasses = relationship("Glasses", back_populates="images")

class Color(Base):
    """
    Modèle représentant une couleur disponible pour les lunettes.
    
    Attributes:
        id (int): Identifiant unique de la couleur
        name (str): Nom de la couleur
        hex_code (str): Code hexadécimal de la couleur
    """
    __tablename__ = "colors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    hex_code = Column(String)

class Category(Base):
    """
    Modèle représentant une catégorie de lunettes.
    
    Attributes:
        id (int): Identifiant unique de la catégorie
        name (str): Nom de la catégorie
    """
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

class FaceShape(Base):
    """
    Modèle représentant une forme de visage.
    
    Attributes:
        id (int): Identifiant unique de la forme
        name (str): Nom de la forme (rond, ovale, carré, etc.)
    """
    __tablename__ = "face_shapes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False) 