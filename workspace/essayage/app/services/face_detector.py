import mediapipe as mp
import numpy as np
from fastapi import UploadFile
import cv2
from ..models.face import FaceLandmarks, Point2D, Point3D, GlassesPosition

class FaceDetectorService:
    def __init__(self):
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            min_detection_confidence=0.5,
            refine_landmarks=True
        )

    async def detect_landmarks(self, image: UploadFile) -> tuple[FaceLandmarks, GlassesPosition]:
        """
        Détecte les points de repère du visage et calcule la position des lunettes.
        """
        # Lire l'image
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convertir en RGB pour MediaPipe
        rgb_image = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        height, width = rgb_image.shape[:2]
        
        # Détecter les landmarks
        results = self.face_mesh.process(rgb_image)
        
        if not results.multi_face_landmarks:
            raise ValueError("No face detected in the image")
            
        # Convertir les landmarks en liste de Point2D
        landmarks = []
        face_landmarks = results.multi_face_landmarks[0].landmark
        for landmark in face_landmarks:
            landmarks.append(Point2D(
                x=landmark.x * width,
                y=landmark.y * height
            ))
        
        # Calculer la position des lunettes
        glasses_position = self._calculate_glasses_position(face_landmarks, width, height)
            
        return (
            FaceLandmarks(
                landmarks=landmarks,
                image_width=width,
                image_height=height
            ),
            glasses_position
        )

    def _calculate_glasses_position(self, face_landmarks, width: int, height: int) -> GlassesPosition:
        """
        Calcule la position, rotation et échelle des lunettes basées sur les points du visage.
        """
        # Points clés pour les lunettes (indices des points MediaPipe)
        LEFT_EYE = 33  # Point extérieur de l'œil gauche
        RIGHT_EYE = 263  # Point extérieur de l'œil droit
        NOSE_TIP = 1  # Bout du nez
        
        # Extraire les points clés
        left_eye = face_landmarks[LEFT_EYE]
        right_eye = face_landmarks[RIGHT_EYE]
        nose = face_landmarks[NOSE_TIP]
        
        # Calculer la position (centre entre les yeux)
        pos_x = (left_eye.x + right_eye.x) / 2
        pos_y = (left_eye.y + right_eye.y) / 2
        pos_z = (left_eye.z + right_eye.z) / 2
        
        # Calculer la rotation (basée sur l'angle entre les yeux)
        dx = right_eye.x - left_eye.x
        dy = right_eye.y - left_eye.y
        rotation_z = np.arctan2(dy, dx)
        
        # Calculer l'échelle (basée sur la distance entre les yeux)
        eye_distance = np.sqrt(dx**2 + dy**2) * width  # Convertir en pixels
        scale = eye_distance / 100  # Normaliser par rapport à une taille de référence
        
        return GlassesPosition(
            position=Point3D(x=pos_x * width, y=pos_y * height, z=pos_z * 1000),
            rotation=Point3D(x=0, y=0, z=rotation_z),
            scale=Point3D(x=scale, y=scale, z=scale)
        ) 