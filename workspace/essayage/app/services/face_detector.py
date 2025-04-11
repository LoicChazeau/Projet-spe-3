"""
Service de détection faciale utilisant MediaPipe Face Mesh.

Ce module fournit les fonctionnalités de détection et de suivi facial pour l'application
d'essayage virtuel de lunettes. Il utilise MediaPipe Face Mesh pour détecter les points
de repère du visage et calcule la position, la rotation et l'échelle des lunettes.

Classes:
    FaceDetectorService: Service principal de détection faciale.
"""

import mediapipe as mp
import numpy as np
from fastapi import UploadFile
import cv2
from ..models.face import FaceLandmarks, Point2D, Point3D, GlassesPosition
from .kalman_filter import KalmanFilter3D
import time

class FaceDetectorService:
    """
    Service de détection faciale utilisant MediaPipe Face Mesh.
    
    Ce service gère la détection des points de repère du visage, le calcul de la position
    des lunettes et le suivi des mouvements de la tête. Il utilise un filtre de Kalman
    pour lisser les mouvements et maintenir le tracking.
    
    Attributes:
        face_mesh: Instance de MediaPipe Face Mesh
        kalman_filter: Filtre de Kalman pour le lissage des mouvements
        last_position: Dernière position connue des lunettes
        smoothing_factor: Facteur de lissage pour les mouvements
        detection_history: Historique des détections
        consecutive_failures: Nombre d'échecs consécutifs de détection
        max_consecutive_failures: Nombre maximum d'échecs consécutifs tolérés
        recovery_delay: Délai de récupération en secondes
        last_detection_time: Temps de la dernière détection
    """
    
    # Points clés pour les lunettes (indices des points MediaPipe)
    # Points des yeux
    LEFT_EYE_OUTER = 33
    LEFT_EYE_INNER = 133
    RIGHT_EYE_OUTER = 263
    RIGHT_EYE_INNER = 362
    
    # Points supplémentaires pour les yeux
    LEFT_EYE_TOP = 159
    LEFT_EYE_BOTTOM = 145
    RIGHT_EYE_TOP = 386
    RIGHT_EYE_BOTTOM = 374
    
    # Points du nez
    NOSE_BRIDGE = 168
    NOSE_TIP = 1
    NOSE_BOTTOM = 2
    NOSE_LEFT = 98
    NOSE_RIGHT = 327
    
    # Points des tempes
    LEFT_TEMPLE = 447
    RIGHT_TEMPLE = 227
    
    # Points du contour du visage
    FACE_LEFT = 234
    FACE_RIGHT = 454
    FACE_TOP = 10
    FACE_BOTTOM = 152
    
    # Points supplémentaires pour la précision
    LEFT_EYEBROW_INNER = 105
    LEFT_EYEBROW_OUTER = 46
    RIGHT_EYEBROW_INNER = 334
    RIGHT_EYEBROW_OUTER = 276
    LEFT_CHEEK = 123
    RIGHT_CHEEK = 352

    def __init__(self):
        """
        Initialise le service de détection faciale.
        
        Configure MediaPipe Face Mesh avec les paramètres optimaux pour la détection
        et le suivi en temps réel. Initialise également le filtre de Kalman et les
        variables de suivi.
        """
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7,
            refine_landmarks=True
        )
        self.kalman_filter = KalmanFilter3D()
        self.last_position = None
        self.smoothing_factor = 0.05
        self.detection_history = []
        self.consecutive_failures = 0
        self.max_consecutive_failures = 3
        self.recovery_delay = 0.3
        self.last_detection_time = 0

    async def detect_landmarks(self, image: UploadFile) -> tuple[FaceLandmarks, GlassesPosition]:
        """
        Détecte les points de repère du visage dans une image.
        
        Args:
            image: Fichier image à analyser
            
        Returns:
            Tuple contenant les points de repère du visage et la position des lunettes
            
        Raises:
            ValueError: Si aucun visage n'est détecté ou si la qualité de détection est insuffisante
        """
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return self.process_image(img)

    def process_image(self, img: np.ndarray) -> tuple[FaceLandmarks, GlassesPosition]:
        """
        Traite une image pour détecter les points de repère du visage.
        
        Args:
            img: Image numpy à traiter
            
        Returns:
            Tuple contenant les points de repère du visage et la position des lunettes
            
        Raises:
            ValueError: Si aucun visage n'est détecté ou si la qualité de détection est insuffisante
        """
        # Convertir en RGB
        rgb_image = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        height, width = rgb_image.shape[:2]
        
        # Utiliser l'image en pleine résolution
        results = self.face_mesh.process(rgb_image)
        
        current_time = time.time()
        
        if not results.multi_face_landmarks:
            self.consecutive_failures += 1
            if (self.last_position and 
                self.consecutive_failures < self.max_consecutive_failures and
                current_time - self.last_detection_time < self.recovery_delay):
                return self._create_response_from_last_position(width, height)
            raise ValueError("No face detected in the image")
            
        # Réinitialiser le compteur d'échecs et mettre à jour le temps
        self.consecutive_failures = 0
        self.last_detection_time = current_time
        
        # Convertir les landmarks en Point2D
        landmarks = []
        face_landmarks = results.multi_face_landmarks[0].landmark
        
        # Vérifier la qualité de la détection
        if not self._is_detection_quality_good(face_landmarks):
            self.consecutive_failures += 1
            if (self.last_position and 
                self.consecutive_failures < self.max_consecutive_failures and
                current_time - self.last_detection_time < self.recovery_delay):
                return self._create_response_from_last_position(width, height)
            raise ValueError("Poor face detection quality")
        
        for landmark in face_landmarks:
            landmarks.append(Point2D(
                x=landmark.x * width,
                y=landmark.y * height
            ))
        
        # Calculer la position des lunettes
        glasses_position = self._calculate_glasses_position(face_landmarks, width, height)
        
        # Mettre à jour le filtre de Kalman
        position_array = np.array([
            glasses_position.position.x,
            glasses_position.position.y,
            glasses_position.position.z
        ])
        
        # Mettre à jour le filtre
        filtered_position = self.kalman_filter.update(position_array)
        
        # Mettre à jour la position des lunettes
        glasses_position.position = Point3D(
            x=filtered_position[0],
            y=filtered_position[1],
            z=filtered_position[2]
        )
        
        # Stocker la dernière position
        self.last_position = glasses_position
            
        return (
            FaceLandmarks(
                landmarks=landmarks,
                image_width=width,
                image_height=height
            ),
            glasses_position
        )

    def _is_detection_quality_good(self, landmarks) -> bool:
        """
        Vérifie la qualité de la détection faciale.
        
        Args:
            landmarks: Points de repère détectés
            
        Returns:
            True si la qualité de détection est suffisante, False sinon
        """
        # Vérifier si les points clés sont présents
        key_points = [
            self.LEFT_EYE_OUTER, self.LEFT_EYE_INNER,
            self.RIGHT_EYE_OUTER, self.RIGHT_EYE_INNER,
            self.NOSE_BRIDGE, self.NOSE_TIP,
            self.LEFT_TEMPLE, self.RIGHT_TEMPLE
        ]
        
        for point in key_points:
            if not (0 <= point < len(landmarks)):
                return False
        
        # Vérifier la symétrie des yeux
        left_eye_width = abs(landmarks[self.LEFT_EYE_OUTER].x - landmarks[self.LEFT_EYE_INNER].x)
        right_eye_width = abs(landmarks[self.RIGHT_EYE_OUTER].x - landmarks[self.RIGHT_EYE_INNER].x)
        eye_width_ratio = min(left_eye_width, right_eye_width) / max(left_eye_width, right_eye_width)
        
        if eye_width_ratio < 0.2:
            return False
        
        return True

    def _calculate_glasses_position(self, face_landmarks, width: int, height: int) -> GlassesPosition:
        """
        Calcule la position, la rotation et l'échelle des lunettes.
        
        Args:
            face_landmarks: Points de repère du visage
            width: Largeur de l'image
            height: Hauteur de l'image
            
        Returns:
            Position, rotation et échelle des lunettes
        """
        # Extraire les points clés
        left_eye_outer = face_landmarks[self.LEFT_EYE_OUTER]
        left_eye_inner = face_landmarks[self.LEFT_EYE_INNER]
        right_eye_outer = face_landmarks[self.RIGHT_EYE_OUTER]
        right_eye_inner = face_landmarks[self.RIGHT_EYE_INNER]
        nose_bridge = face_landmarks[self.NOSE_BRIDGE]
        nose_tip = face_landmarks[self.NOSE_TIP]
        left_temple = face_landmarks[self.LEFT_TEMPLE]
        right_temple = face_landmarks[self.RIGHT_TEMPLE]
        
        # Calculer le centre des yeux avec plus de points
        left_eye_center_x = (left_eye_outer.x + left_eye_inner.x + 
                           face_landmarks[self.LEFT_EYE_TOP].x + 
                           face_landmarks[self.LEFT_EYE_BOTTOM].x) / 4
        left_eye_center_y = (left_eye_outer.y + left_eye_inner.y + 
                           face_landmarks[self.LEFT_EYE_TOP].y + 
                           face_landmarks[self.LEFT_EYE_BOTTOM].y) / 4
        right_eye_center_x = (right_eye_outer.x + right_eye_inner.x + 
                            face_landmarks[self.RIGHT_EYE_TOP].x + 
                            face_landmarks[self.RIGHT_EYE_BOTTOM].x) / 4
        right_eye_center_y = (right_eye_outer.y + right_eye_inner.y + 
                            face_landmarks[self.RIGHT_EYE_TOP].y + 
                            face_landmarks[self.RIGHT_EYE_BOTTOM].y) / 4
        
        # Position X : centre entre les yeux
        pos_x = (left_eye_center_x + right_eye_center_x) / 2 * width
        
        # Position Y : ajustée en fonction de la hauteur du nez et des sourcils
        eye_center_y = (left_eye_center_y + right_eye_center_y) / 2
        nose_height = nose_bridge.y - face_landmarks[self.NOSE_BOTTOM].y
        eyebrow_height = (face_landmarks[self.LEFT_EYEBROW_INNER].y + 
                         face_landmarks[self.RIGHT_EYEBROW_INNER].y) / 2
        pos_y = (eye_center_y + (nose_height * 0.2) + (eyebrow_height - eye_center_y) * 0.3) * height
        
        # Position Z : améliorée avec la profondeur du nez et des joues
        eye_distance = abs(right_eye_center_x - left_eye_center_x) * width
        nose_depth = abs(nose_tip.z - nose_bridge.z)
        cheek_depth = (face_landmarks[self.LEFT_CHEEK].z + face_landmarks[self.RIGHT_CHEEK].z) / 2
        base_distance = width * 0.2
        pos_z = -(base_distance / (eye_distance * (1 + nose_depth + cheek_depth))) * 100
        
        # Rotation X (pitch) : améliorée avec plus de points
        dx_nose = nose_tip.x - nose_bridge.x
        dy_nose = nose_tip.y - nose_bridge.y
        dz_nose = nose_tip.z - nose_bridge.z
        rotation_x = np.arctan2(dy_nose, np.sqrt(dx_nose**2 + dz_nose**2))
        
        # Rotation Y (yaw) : améliorée avec les tempes et les joues
        eye_depth_diff = (right_eye_outer.z - left_eye_outer.z)
        temple_depth_diff = (right_temple.z - left_temple.z)
        cheek_depth_diff = (face_landmarks[self.RIGHT_CHEEK].z - face_landmarks[self.LEFT_CHEEK].z)
        rotation_y = np.arctan2((eye_depth_diff + temple_depth_diff + cheek_depth_diff) / 3, 
                              right_eye_center_x - left_eye_center_x)
        
        # Rotation Z (roll) : améliorée avec les tempes et les sourcils
        dy_eyes = right_eye_center_y - left_eye_center_y
        dx_eyes = right_eye_center_x - left_eye_center_x
        dy_temples = right_temple.y - left_temple.y
        dx_temples = right_temple.x - left_temple.x
        dy_eyebrows = (face_landmarks[self.RIGHT_EYEBROW_INNER].y - 
                      face_landmarks[self.LEFT_EYEBROW_INNER].y)
        dx_eyebrows = (face_landmarks[self.RIGHT_EYEBROW_INNER].x - 
                      face_landmarks[self.LEFT_EYEBROW_INNER].x)
        rotation_z = np.arctan2((dy_eyes + dy_temples + dy_eyebrows) / 3, 
                              (dx_eyes + dx_temples + dx_eyebrows) / 3)
        
        # Échelle basée sur la distance entre les yeux et la largeur du visage
        eye_width = abs(right_eye_outer.x - left_eye_outer.x) * width
        face_width = abs(right_temple.x - left_temple.x) * width
        eyebrow_width = abs(face_landmarks[self.RIGHT_EYEBROW_OUTER].x - 
                          face_landmarks[self.LEFT_EYEBROW_OUTER].x) * width
        scale_base = (eye_width + face_width * 0.2 + eyebrow_width * 0.1) / 100
        
        scale_x = scale_base
        scale_y = scale_base * 0.4
        scale_z = scale_base * 0.6
        
        return GlassesPosition(
            position=Point3D(x=pos_x, y=pos_y, z=pos_z),
            rotation=Point3D(x=rotation_x, y=rotation_y, z=rotation_z),
            scale=Point3D(x=scale_x, y=scale_y, z=scale_z)
        )

    def _create_response_from_last_position(self, width: int, height: int) -> tuple[FaceLandmarks, GlassesPosition]:
        """
        Crée une réponse avec la dernière position connue.
        
        Args:
            width: Largeur de l'image
            height: Hauteur de l'image
            
        Returns:
            Tuple contenant des landmarks factices et la dernière position connue
        """
        # Créer des landmarks factices basés sur la dernière position connue
        landmarks = [
            Point2D(x=width/2, y=height/2)  # Point central
        ]
        return (
            FaceLandmarks(
                landmarks=landmarks,
                image_width=width,
                image_height=height
            ),
            self.last_position
        ) 