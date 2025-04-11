import mediapipe as mp
import numpy as np
from fastapi import UploadFile
import cv2
from ..models.face import FaceLandmarks, Point2D, Point3D, GlassesPosition

class FaceDetectorService:
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
    
    # Points des tempes
    LEFT_TEMPLE = 447
    RIGHT_TEMPLE = 227
    
    # Points du contour du visage
    FACE_LEFT = 234
    FACE_RIGHT = 454
    FACE_TOP = 10
    FACE_BOTTOM = 152

    def __init__(self):
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            min_detection_confidence=0.7,  # Augmenté pour plus de précision
            min_tracking_confidence=0.7,   # Augmenté pour plus de stabilité
            refine_landmarks=True
        )
        self.last_position = None
        self.smoothing_factor = 0.3
        self.detection_history = []

    async def detect_landmarks(self, image: UploadFile) -> tuple[FaceLandmarks, GlassesPosition]:
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return self.process_image(img)

    def process_image(self, img: np.ndarray) -> tuple[FaceLandmarks, GlassesPosition]:
        # Convertir en RGB et redimensionner pour optimiser les performances
        rgb_image = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        height, width = rgb_image.shape[:2]
        
        # Redimensionner l'image pour le traitement
        scale_factor = 0.5
        small_image = cv2.resize(rgb_image, (int(width * scale_factor), int(height * scale_factor)))
        
        # Détecter les landmarks
        results = self.face_mesh.process(small_image)
        
        if not results.multi_face_landmarks:
            if self.last_position:
                return self._create_response_from_last_position(width, height)
            raise ValueError("No face detected in the image")
            
        # Convertir les landmarks en coordonnées originales
        landmarks = []
        face_landmarks = results.multi_face_landmarks[0].landmark
        
        # Vérifier la qualité de la détection
        if not self._is_detection_quality_good(face_landmarks):
            if self.last_position:
                return self._create_response_from_last_position(width, height)
            raise ValueError("Poor face detection quality")
        
        # Stocker les landmarks pour l'historique
        self.detection_history.append(face_landmarks)
        if len(self.detection_history) > 5:  # Garder les 5 dernières détections
            self.detection_history.pop(0)
        
        # Convertir les landmarks en Point2D
        for landmark in face_landmarks:
            landmarks.append(Point2D(
                x=landmark.x * width,
                y=landmark.y * height
            ))
        
        # Calculer la position des lunettes
        glasses_position = self._calculate_glasses_position(face_landmarks, width, height)
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
        """Vérifie la qualité de la détection faciale"""
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
        
        if eye_width_ratio < 0.7:  # Les yeux doivent être relativement symétriques
            return False
        
        return True

    def _calculate_glasses_position(self, face_landmarks, width: int, height: int) -> GlassesPosition:
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
        
        # Position Y : ajustée en fonction de la hauteur du nez
        eye_center_y = (left_eye_center_y + right_eye_center_y) / 2
        nose_height = nose_bridge.y - face_landmarks[self.NOSE_BOTTOM].y
        pos_y = (eye_center_y + nose_height * 0.2) * height
        
        # Position Z : améliorée avec la profondeur du nez
        eye_distance = abs(right_eye_center_x - left_eye_center_x) * width
        nose_depth = abs(nose_tip.z - nose_bridge.z)
        base_distance = width * 0.2
        pos_z = -(base_distance / (eye_distance * (1 + nose_depth))) * 100
        
        # Rotation X (pitch) : améliorée avec plus de points
        dx_nose = nose_tip.x - nose_bridge.x
        dy_nose = nose_tip.y - nose_bridge.y
        dz_nose = nose_tip.z - nose_bridge.z
        rotation_x = np.arctan2(dy_nose, np.sqrt(dx_nose**2 + dz_nose**2))
        
        # Rotation Y (yaw) : améliorée avec les tempes
        eye_depth_diff = (right_eye_outer.z - left_eye_outer.z)
        temple_depth_diff = (right_temple.z - left_temple.z)
        rotation_y = np.arctan2((eye_depth_diff + temple_depth_diff) / 2, 
                              right_eye_center_x - left_eye_center_x)
        
        # Rotation Z (roll) : améliorée avec les tempes
        dy_eyes = right_eye_center_y - left_eye_center_y
        dx_eyes = right_eye_center_x - left_eye_center_x
        dy_temples = right_temple.y - left_temple.y
        dx_temples = right_temple.x - left_temple.x
        rotation_z = np.arctan2((dy_eyes + dy_temples) / 2, 
                              (dx_eyes + dx_temples) / 2)
        
        # Échelle basée sur la distance entre les yeux et la largeur du visage
        eye_width = abs(right_eye_outer.x - left_eye_outer.x) * width
        face_width = abs(right_temple.x - left_temple.x) * width
        scale_base = (eye_width + face_width * 0.2) / 100
        
        scale_x = scale_base
        scale_y = scale_base * 0.4
        scale_z = scale_base * 0.6
        
        # Appliquer le lissage si une position précédente existe
        if self.last_position:
            pos_x = self._smooth_value(pos_x, self.last_position.position.x)
            pos_y = self._smooth_value(pos_y, self.last_position.position.y)
            pos_z = self._smooth_value(pos_z, self.last_position.position.z)
            rotation_x = self._smooth_value(rotation_x, self.last_position.rotation.x)
            rotation_y = self._smooth_value(rotation_y, self.last_position.rotation.y)
            rotation_z = self._smooth_value(rotation_z, self.last_position.rotation.z)
            scale_x = self._smooth_value(scale_x, self.last_position.scale.x)
            scale_y = self._smooth_value(scale_y, self.last_position.scale.y)
            scale_z = self._smooth_value(scale_z, self.last_position.scale.z)
        
        return GlassesPosition(
            position=Point3D(x=pos_x, y=pos_y, z=pos_z),
            rotation=Point3D(x=rotation_x, y=rotation_y, z=rotation_z),
            scale=Point3D(x=scale_x, y=scale_y, z=scale_z)
        )

    def _smooth_value(self, current: float, previous: float) -> float:
        return previous + (current - previous) * self.smoothing_factor

    def _create_response_from_last_position(self, width: int, height: int) -> tuple[FaceLandmarks, GlassesPosition]:
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