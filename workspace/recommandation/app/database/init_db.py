from .database import init_db, SessionLocal
from .migrations import run_migration
import os
import logging
from sqlalchemy import text

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clean_database(db):
    """
    Nettoie la base de données en supprimant toutes les données existantes.
    
    Args:
        db (Session): Session de base de données
    """
    try:
        # Désactiver les contraintes de clé étrangère
        db.execute(text("PRAGMA foreign_keys=OFF"))
        
        # Supprimer les données de toutes les tables
        db.execute(text("DELETE FROM glasses_face_shapes"))
        db.execute(text("DELETE FROM glasses_colors"))
        db.execute(text("DELETE FROM glasses_categories"))
        db.execute(text("DELETE FROM images"))
        db.execute(text("DELETE FROM glasses"))
        db.execute(text("DELETE FROM face_shapes"))
        db.execute(text("DELETE FROM colors"))
        db.execute(text("DELETE FROM categories"))
        
        # Réactiver les contraintes de clé étrangère
        db.execute(text("PRAGMA foreign_keys=ON"))
        
        db.commit()
        logger.info("Base de données nettoyée avec succès")
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors du nettoyage de la base de données: {str(e)}")
        raise

def initialize_database(json_file_path: str = "glasses_data.json"):
    """
    Initialise la base de données et migre les données.
    
    Args:
        json_file_path (str): Chemin vers le fichier JSON contenant les données
    """
    try:
        # Initialiser la base de données
        logger.info("Initialisation de la base de données...")
        init_db()
        
        # Obtenir une session
        db = SessionLocal()
        try:
            # Nettoyer la base de données
            clean_database(db)
            
            # Exécuter la migration
            logger.info(f"Migration des données depuis {json_file_path}...")
            run_migration(db, json_file_path)
            logger.info("Migration terminée avec succès")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation de la base de données: {str(e)}")
        raise

if __name__ == "__main__":
    # Chemin absolu vers le fichier JSON
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(current_dir, "data", "glasses_data.json")
    
    logger.info(f"Chemin du fichier JSON: {json_path}")
    initialize_database(json_path) 