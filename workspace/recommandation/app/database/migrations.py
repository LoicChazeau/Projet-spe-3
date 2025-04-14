import json
from typing import Dict, List
from sqlalchemy.orm import Session
from .models import (
    Glasses, Image, Color, Category, FaceShape,
    glasses_face_shapes, glasses_colors, glasses_categories
)

def load_json_data(file_path: str) -> List[Dict]:
    """
    Charge les données depuis le fichier JSON.
    
    Args:
        file_path (str): Chemin vers le fichier JSON
        
    Returns:
        List[Dict]: Liste des données de lunettes
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def create_or_get_face_shape(db: Session, name: str) -> FaceShape:
    """
    Crée ou récupère une forme de visage.
    
    Args:
        db (Session): Session de base de données
        name (str): Nom de la forme de visage
        
    Returns:
        FaceShape: Instance de FaceShape
    """
    face_shape = db.query(FaceShape).filter(FaceShape.name == name).first()
    if not face_shape:
        face_shape = FaceShape(name=name)
        db.add(face_shape)
        db.commit()
        db.refresh(face_shape)
    return face_shape

def create_or_get_color(db: Session, name: str) -> Color:
    """
    Crée ou récupère une couleur.
    
    Args:
        db (Session): Session de base de données
        name (str): Nom de la couleur
        
    Returns:
        Color: Instance de Color
    """
    color = db.query(Color).filter(Color.name == name).first()
    if not color:
        color = Color(name=name)
        db.add(color)
        db.commit()
        db.refresh(color)
    return color

def create_or_get_category(db: Session, name: str) -> Category:
    """
    Crée ou récupère une catégorie.
    
    Args:
        db (Session): Session de base de données
        name (str): Nom de la catégorie
        
    Returns:
        Category: Instance de Category
    """
    category = db.query(Category).filter(Category.name == name).first()
    if not category:
        category = Category(name=name)
        db.add(category)
        db.commit()
        db.refresh(category)
    return category

def migrate_data(db: Session, data: List[Dict]):
    """
    Migre les données vers la nouvelle structure de base de données.
    
    Args:
        db (Session): Session de base de données
        data (List[Dict]): Liste des données à migrer
    """
    for item in data:
        # Création des lunettes
        glasses = Glasses(
            ref=item['ref'],
            brand=item['marque'],
            model=item['nom'],
            price=item['prix_de_base'],
            description=item['description'],
            material=item['matiere_monture'],
            size=item['taille_monture'],
            shape=item['forme']
        )
        db.add(glasses)
        db.commit()
        db.refresh(glasses)
        
        # Ajout des images
        for i, image_url in enumerate(item['images']):
            image = Image(
                url=image_url,
                view_type=f"view_{i+1}",
                glasses_id=glasses.id
            )
            db.add(image)
        
        # Ajout des formes de visage recommandées
        for face_shape_name in item['forme_visage_recommandee']:
            face_shape = create_or_get_face_shape(db, face_shape_name)
            glasses.recommended_face_shapes.append(face_shape)
        
        # Ajout des couleurs
        for color_name in item['couleurs_disponibles']:
            color = create_or_get_color(db, color_name)
            glasses.colors.append(color)
        
        # Ajout des catégories
        for category_name in item['categories']:
            category = create_or_get_category(db, category_name)
            glasses.categories.append(category)
        
        db.commit()

def run_migration(db: Session, json_file_path: str):
    """
    Exécute la migration complète.
    
    Args:
        db (Session): Session de base de données
        json_file_path (str): Chemin vers le fichier JSON
    """
    try:
        data = load_json_data(json_file_path)
        migrate_data(db, data)
        print("Migration terminée avec succès!")
    except Exception as e:
        print(f"Erreur lors de la migration: {e}")
        db.rollback()
        raise 