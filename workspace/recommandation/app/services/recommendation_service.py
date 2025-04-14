import cv2
import numpy as np
import math
import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from ..models.recommendation import FaceAnalysis, GlassesRecommendation
from database import Glasses

logger = logging.getLogger(__name__)

class RecommendationService:
    def __init__(self):
        try:
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            logger.info("Modèle de détection de visage chargé avec succès")
        except Exception as e:
            logger.error(f"Erreur lors du chargement du modèle de détection de visage: {str(e)}")
            raise

    def calculate_face_shape_probabilities(self, aspect_ratio: float, circularity: float, convexity: float) -> dict:
        """Calcule les probabilités pour chaque forme de visage."""
        scores = {
            "rond": 0.0,
            "ovale": 0.0,
            "carré": 0.0,
            "rectangulaire": 0.0
        }
        
        # Score pour rond
        if 0.95 <= aspect_ratio <= 1.05:
            scores["rond"] += 30
        if 0.08 <= circularity <= 0.09:
            scores["rond"] += 50
        if convexity >= 0.58:
            scores["rond"] += 20
            
        # Score pour ovale
        if 0.85 <= aspect_ratio <= 1.15:
            scores["ovale"] += 25
        if 0.095 <= circularity <= 0.13:
            scores["ovale"] += 55
        if convexity >= 0.55:
            scores["ovale"] += 20
            
        # Score pour carré
        if 0.95 <= aspect_ratio <= 1.05:
            scores["carré"] += 30
        if 0.06 <= circularity <= 0.075:
            scores["carré"] += 50
        if 0.52 <= convexity <= 0.57:
            scores["carré"] += 20
            
        # Score pour rectangulaire
        if aspect_ratio <= 0.85 or aspect_ratio >= 1.3:
            scores["rectangulaire"] += 40
        if circularity <= 0.055:
            scores["rectangulaire"] += 40
        if convexity <= 0.54:
            scores["rectangulaire"] += 20
        
        # Normaliser les scores
        total = sum(scores.values())
        if total > 0:
            for shape in scores:
                scores[shape] = round((scores[shape] / total) * 100, 1)
        
        return scores

    def detect_face_shape(self, face_roi: np.ndarray) -> str:
        """Détecte la forme du visage en analysant les proportions et les caractéristiques."""
        try:
            gray = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            gray = clahe.apply(gray)
            blurred = cv2.GaussianBlur(gray, (7, 7), 0)
            edges = cv2.Canny(blurred, 30, 150)
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            edges = cv2.dilate(edges, kernel, iterations=2)
            edges = cv2.erode(edges, kernel, iterations=1)
            
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if not contours:
                logger.warning("Aucun contour trouvé dans l'image")
                return "indéterminée"
            
            face_contour = max(contours, key=cv2.contourArea)
            x, y, w, h = cv2.boundingRect(face_contour)
            aspect_ratio = float(w) / float(h)
            
            perimeter = cv2.arcLength(face_contour, True)
            area = cv2.contourArea(face_contour)
            circularity = 4 * math.pi * area / (perimeter * perimeter) if perimeter > 0 else 0
            
            hull = cv2.convexHull(face_contour)
            hull_area = cv2.contourArea(hull)
            convexity = area / hull_area if hull_area > 0 else 0
            
            probabilities = self.calculate_face_shape_probabilities(aspect_ratio, circularity, convexity)
            
            logger.info(f"Mesures: aspect_ratio={aspect_ratio:.3f}, circularity={circularity:.3f}, convexity={convexity:.3f}")
            logger.info(f"Probabilités: {probabilities}")
            
            return max(probabilities.items(), key=lambda x: x[1])[0]
                    
        except Exception as e:
            logger.error(f"Erreur lors de la détection de la forme du visage: {str(e)}")
            return "indéterminée"

    def analyze_face(self, image: np.ndarray) -> FaceAnalysis:
        """Analyse le visage pour déterminer les caractéristiques pertinentes."""
        try:
            if len(image.shape) != 3:
                logger.error("L'image n'est pas en couleur")
                raise ValueError("L'image doit être en couleur (3 canaux)")
                
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
            
            if len(faces) == 0:
                logger.warning("Aucun visage détecté dans l'image")
                raise ValueError("Aucun visage détecté")
            
            x, y, w, h = faces[0]
            face_roi = image[y:y+h, x:x+w]
            
            face_shape = self.detect_face_shape(face_roi)
            logger.info(f"Forme du visage détectée : {face_shape}")
            
            return FaceAnalysis(
                face_shape=face_shape,
                face_width=int(w),
                face_height=int(h)
            )
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse du visage: {str(e)}")
            raise

    def recommend_glasses(self, face_analysis: FaceAnalysis, db: Session) -> List[GlassesRecommendation]:
        """Recommande des types de lunettes basés sur l'analyse du visage."""
        try:
            recommendations = []
            face_shape = face_analysis.face_shape
            
            # Récupérer les lunettes de la base de données
            if face_shape == "ovale":
                glasses = db.query(Glasses).filter(Glasses.category == "rectangulaires").all()
            elif face_shape == "rond":
                glasses = db.query(Glasses).filter(Glasses.category == "rectangulaires").all()
            elif face_shape == "rectangulaire":
                glasses = db.query(Glasses).filter(Glasses.category == "rondes").all()
            elif face_shape == "carré":
                glasses = db.query(Glasses).filter(Glasses.category == "rondes").all()
            else:
                glasses = db.query(Glasses).filter(Glasses.category == "classiques").all()
            
            # Convertir les résultats en format de recommandation
            for glass in glasses:
                recommendations.append(GlassesRecommendation(
                    type=f"Lunettes {glass.category}",
                    brand=glass.brand,
                    model=glass.model,
                    image_url=glass.image_url,
                    price=glass.price,
                    description=glass.description,
                    styles=[style.name for style in glass.styles]
                ))
            
            logger.info(f"Recommandations générées : {[r.type for r in recommendations]}")
            return recommendations
        except Exception as e:
            logger.error(f"Erreur lors de la génération des recommandations: {str(e)}")
            raise 