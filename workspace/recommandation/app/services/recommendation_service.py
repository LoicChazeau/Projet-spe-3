"""Service de recommandation de lunettes."""
import cv2
import numpy as np
import logging
import mediapipe as mp
import math
from typing import List, Optional, Tuple, Dict
from sqlalchemy.orm import Session
from app.database.models import Glasses
from app.models.recommendation import FaceAnalysis, GlassesRecommendation, RecommendationResponse

logger = logging.getLogger(__name__)

class RecommendationService:
    def __init__(self):
        """Initialise le service de recommandation avec MediaPipe."""
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        logger.info("Service de recommandation initialisé avec MediaPipe")

    def _calculate_distance(self, point1: Tuple[float, float], point2: Tuple[float, float]) -> float:
        """Calcule la distance euclidienne entre deux points."""
        return math.sqrt((point2[0] - point1[0])**2 + (point2[1] - point1[1])**2)

    def _get_landmark_coordinates(self, landmarks, index: int, image_shape: Tuple[int, int]) -> Tuple[float, float]:
        """Convertit les coordonnées normalisées en coordonnées d'image."""
        landmark = landmarks.landmark[index]
        return (landmark.x * image_shape[1], landmark.y * image_shape[0])

    def analyze_face(self, image: np.ndarray) -> FaceAnalysis:
        """Analyse un visage et retourne ses caractéristiques."""
        try:
            # Convertir l'image en RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            image_shape = image.shape[:2]
            
            # Détecter les points du visage
            results = self.face_mesh.process(image_rgb)
            if not results.multi_face_landmarks:
                logger.warning("Aucun visage détecté dans l'image")
                raise ValueError("Aucun visage détecté dans l'image")

            landmarks = results.multi_face_landmarks[0]
            
            # Obtenir les points clés
            front_top = self._get_landmark_coordinates(landmarks, 10, image_shape)
            front_left = self._get_landmark_coordinates(landmarks, 8, image_shape)
            front_right = self._get_landmark_coordinates(landmarks, 9, image_shape)
            chin = self._get_landmark_coordinates(landmarks, 152, image_shape)
            left_cheek = self._get_landmark_coordinates(landmarks, 123, image_shape)
            right_cheek = self._get_landmark_coordinates(landmarks, 352, image_shape)
            left_jaw = self._get_landmark_coordinates(landmarks, 172, image_shape)
            right_jaw = self._get_landmark_coordinates(landmarks, 397, image_shape)
            left_temple = self._get_landmark_coordinates(landmarks, 93, image_shape)
            right_temple = self._get_landmark_coordinates(landmarks, 323, image_shape)
            left_jaw_corner = self._get_landmark_coordinates(landmarks, 136, image_shape)
            right_jaw_corner = self._get_landmark_coordinates(landmarks, 365, image_shape)
            
            # Calculer les mesures
            face_height = self._calculate_distance(front_top, chin)
            cheekbone_width = self._calculate_distance(left_cheek, right_cheek)
            jaw_width = self._calculate_distance(left_jaw, right_jaw)
            temple_width = self._calculate_distance(left_temple, right_temple)
            forehead_width = self._calculate_distance(front_left, front_right)
            jaw_corner_width = self._calculate_distance(left_jaw_corner, right_jaw_corner)
            
            # Calculer les ratios
            jaw_to_cheekbone_ratio = jaw_width / cheekbone_width
            face_width_to_height_ratio = cheekbone_width / face_height
            temple_to_cheekbone_ratio = temple_width / cheekbone_width
            forehead_to_cheekbone_ratio = forehead_width / cheekbone_width
            jaw_corner_to_cheekbone_ratio = jaw_corner_width / cheekbone_width
            
            logger.info(f"Mesures brutes: jaw_width={jaw_width:.1f}, cheekbone_width={cheekbone_width:.1f}, face_height={face_height:.1f}")
            logger.info(f"Ratios: jaw_ratio={jaw_to_cheekbone_ratio:.3f}, face_ratio={face_width_to_height_ratio:.3f}")
            logger.info(f"Ratios supplémentaires: temple={temple_to_cheekbone_ratio:.3f}, forehead={forehead_to_cheekbone_ratio:.3f}, jaw_corner={jaw_corner_to_cheekbone_ratio:.3f}")
            
            # Calculer les scores pour chaque forme
            scores = {
                "rond": 0.0,
                "ovale": 0.0,
                "carré": 0.0,
                "rectangulaire": 0.0
            }
            
            # Score pour rond (visage équilibré)
            if 0.95 <= jaw_to_cheekbone_ratio <= 1.05:  # Mâchoire et pommettes très similaires
                scores["rond"] += 20
            if 0.95 <= face_width_to_height_ratio <= 1.05:  # Ratio largeur/hauteur très proche de 1
                scores["rond"] += 20
            if 0.9 <= temple_to_cheekbone_ratio <= 1.1:  # Tempes et pommettes similaires
                scores["rond"] += 15
            if 0.9 <= forehead_to_cheekbone_ratio <= 1.1:  # Front et pommettes similaires
                scores["rond"] += 15
            if 0.9 <= jaw_corner_to_cheekbone_ratio <= 1.1:  # Coins de mâchoire et pommettes similaires
                scores["rond"] += 15
                
            # Score pour ovale (visage allongé)
            if 0.8 <= jaw_to_cheekbone_ratio < 0.9:  # Mâchoire légèrement plus étroite
                scores["ovale"] += 15
            if 0.8 <= face_width_to_height_ratio < 0.9:  # Visage légèrement plus haut
                scores["ovale"] += 15
            if temple_to_cheekbone_ratio < 0.9:  # Tempes plus étroites
                scores["ovale"] += 15
            if forehead_to_cheekbone_ratio < 0.9:  # Front plus étroit
                scores["ovale"] += 15
            if jaw_corner_to_cheekbone_ratio < 0.9:  # Coins de mâchoire plus étroits
                scores["ovale"] += 15
                
            # Score pour carré (visage anguleux)
            if 0.95 <= jaw_to_cheekbone_ratio <= 1.05:  # Mâchoire et pommettes très similaires
                scores["carré"] += 15
            if 0.7 <= face_width_to_height_ratio < 0.8:  # Visage plus haut que large
                scores["carré"] += 20
            if temple_to_cheekbone_ratio > 1.1:  # Tempes plus larges
                scores["carré"] += 15
            if forehead_to_cheekbone_ratio > 1.1:  # Front plus large
                scores["carré"] += 15
            if jaw_corner_to_cheekbone_ratio > 1.1:  # Coins de mâchoire plus larges
                scores["carré"] += 15
                
            # Score pour rectangulaire (visage très allongé)
            if jaw_to_cheekbone_ratio < 0.85:  # Mâchoire plus étroite
                scores["rectangulaire"] += 15
            if face_width_to_height_ratio < 0.75:  # Visage beaucoup plus haut
                scores["rectangulaire"] += 20
            if temple_to_cheekbone_ratio < 0.85:  # Tempes beaucoup plus étroites
                scores["rectangulaire"] += 15
            if forehead_to_cheekbone_ratio < 0.85:  # Front beaucoup plus étroit
                scores["rectangulaire"] += 15
            if jaw_corner_to_cheekbone_ratio < 0.85:  # Coins de mâchoire beaucoup plus étroits
                scores["rectangulaire"] += 15
            
            # Normaliser les scores
            total = sum(scores.values())
            if total > 0:
                for shape in scores:
                    scores[shape] = int(round((scores[shape] / total) * 100))
            
            # Déterminer la forme dominante
            face_shape = max(scores.items(), key=lambda x: x[1])[0]
            
            logger.info(f"Probabilités finales: {scores}")
            
            # Créer l'analyse du visage
            analysis = FaceAnalysis(
                face_shape=face_shape,
                face_width=int(cheekbone_width),
                face_height=int(face_height),
                forehead_width=int(forehead_width),
                cheekbone_width=int(cheekbone_width),
                jaw_width=int(jaw_width),
                eye_distance=int(forehead_width * 0.3),  # Estimation
                face_ratio=face_width_to_height_ratio,
                probabilities=scores
            )
            
            return analysis
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse du visage: {str(e)}")
            raise ValueError(f"Erreur lors de l'analyse du visage: {str(e)}")

    def calculate_compatibility_score(self, face_analysis: FaceAnalysis, glasses: Glasses) -> float:
        """Calcule un score de compatibilité entre un visage et une paire de lunettes."""
        try:
            score = 0.0
            
            # Vérifier si la forme du visage est recommandée pour ces lunettes
            if face_analysis.face_shape in glasses.recommended_face_shapes:
                score += 50
                
            # Vérifier si la forme des lunettes est compatible avec le visage
            if face_analysis.face_shape == "ovale" and glasses.shape in ["rectangulaire", "carré"]:
                score += 30
            elif face_analysis.face_shape == "rectangulaire" and glasses.shape in ["ovale", "rond"]:
                score += 30
            elif face_analysis.face_shape == "rond" and glasses.shape in ["rectangulaire", "carré"]:
                score += 30
            elif face_analysis.face_shape == "carré" and glasses.shape in ["ovale", "rond"]:
                score += 30
                
            # Ajuster le score en fonction des ratios du visage
            if face_analysis.face_ratio < 0.7:  # Visage allongé
                if glasses.shape in ["rectangulaire", "carré"]:
                    score += 20
            elif face_analysis.face_ratio > 0.9:  # Visage large
                if glasses.shape in ["ovale", "rond"]:
                    score += 20
                    
            return score
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul du score de compatibilité: {str(e)}")
            return 0.0

    def recommend_glasses(self, db: Session, face_analysis: FaceAnalysis) -> List[GlassesRecommendation]:
        """
        Recommande des lunettes en fonction de l'analyse du visage.
        
        Args:
            db (Session): Session de base de données
            face_analysis (FaceAnalysis): Analyse du visage
            
        Returns:
            List[GlassesRecommendation]: Liste des recommandations triées par score de compatibilité
        """
        try:
            # Récupérer toutes les lunettes
            glasses = db.query(Glasses).all()
            
            if not glasses:
                logger.warning("Aucune lunette trouvée dans la base de données")
                return []
            
            # Calculer le score de compatibilité pour chaque paire de lunettes
            recommendations = []
            for glass in glasses:
                # Convertir les formes de visage recommandées en minuscules pour la comparaison
                recommended_shapes = [shape.name.lower() for shape in glass.recommended_face_shapes]
                if face_analysis.face_shape.lower() in recommended_shapes:
                    score = self.calculate_compatibility_score(face_analysis, glass)
                    recommendations.append(GlassesRecommendation(
                        id=glass.id,
                        ref=glass.ref,
                        brand=glass.brand,
                        model=glass.model,
                        price=glass.price,
                        description=glass.description,
                        material=glass.material,
                        size=glass.size,
                        shape=glass.shape,
                        categories=[category.name for category in glass.categories],
                        colors=[color.name for color in glass.colors],
                        recommended_face_shapes=[shape.name for shape in glass.recommended_face_shapes],
                        images=[image.url for image in glass.images],
                        compatibility_score=score
                    ))
            
            # Trier les recommandations par score de compatibilité
            recommendations.sort(key=lambda x: x.compatibility_score, reverse=True)
            
            # Limiter à 3 recommandations maximum
            return recommendations[:3]
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération des recommandations: {str(e)}")
            raise 