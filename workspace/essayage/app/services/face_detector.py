import mediapipe as mp
import numpy as np
from fastapi import UploadFile
import cv2
from ..models.face import FaceLandmarks, Point2D, Point3D, GlassesPosition

class FaceDetectorService:
    # Points clés pour les lunettes (indices des points MediaPipe)
    # Points des yeux
    LEFT_EYE_OUTER = 33  # Coin extérieur de l'œil gauche
    LEFT_EYE_INNER = 133  # Coin intérieur de l'œil gauche
    RIGHT_EYE_OUTER = 263  # Coin extérieur de l'œil droit
    RIGHT_EYE_INNER = 362  # Coin intérieur de l'œil droit
    
    # Points du nez
    NOSE_BRIDGE = 168  # Pont du nez (haut)
    NOSE_TIP = 1  # Bout du nez
    
    # Points des tempes
    LEFT_TEMPLE = 447  # Temple gauche
    RIGHT_TEMPLE = 227  # Temple droit

    def __init__(self):
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,  # False pour un meilleur suivi en temps réel
            max_num_faces=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,  # Ajouté pour le temps réel
            refine_landmarks=True
        )

    async def detect_landmarks(self, image: UploadFile) -> tuple[FaceLandmarks, GlassesPosition]:
        """
        Détecte les points de repère du visage à partir d'un fichier uploadé.
        """
        # Lire l'image
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return self.process_image(img)

    def process_image(self, img: np.ndarray) -> tuple[FaceLandmarks, GlassesPosition]:
        """
        Traite une image numpy et retourne les landmarks et la position des lunettes.
        """
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
        # Extraire les points clés
        left_eye_outer = face_landmarks[self.LEFT_EYE_OUTER]
        left_eye_inner = face_landmarks[self.LEFT_EYE_INNER]
        right_eye_outer = face_landmarks[self.RIGHT_EYE_OUTER]
        right_eye_inner = face_landmarks[self.RIGHT_EYE_INNER]
        nose_bridge = face_landmarks[self.NOSE_BRIDGE]
        nose_tip = face_landmarks[self.NOSE_TIP]
        left_temple = face_landmarks[self.LEFT_TEMPLE]
        right_temple = face_landmarks[self.RIGHT_TEMPLE]
        
        print("Face landmarks extracted successfully")
        
        # Calculer le centre des yeux
        left_eye_center_x = (left_eye_outer.x + left_eye_inner.x) / 2
        left_eye_center_y = (left_eye_outer.y + left_eye_inner.y) / 2
        right_eye_center_x = (right_eye_outer.x + right_eye_inner.x) / 2
        right_eye_center_y = (right_eye_outer.y + right_eye_inner.y) / 2
        
        # Position : centre entre les yeux, légèrement ajusté vers le pont du nez
        pos_x = (left_eye_center_x + right_eye_center_x) / 2
        eye_center_y = (left_eye_center_y + right_eye_center_y) / 2
        pos_y = eye_center_y + (nose_bridge.y - eye_center_y) * 0.1
        pos_z = nose_bridge.z
        
        print(f"Calculated position: x={pos_x}, y={pos_y}, z={pos_z}")
        
        # Rotation
        # Angle horizontal (yaw) basé sur la différence de profondeur entre les tempes
        rotation_y = np.arctan2(right_temple.z - left_temple.z, right_temple.x - left_temple.x)
        
        # Angle vertical (pitch) basé sur l'angle entre le pont du nez et le bout du nez
        dx_nose = nose_tip.x - nose_bridge.x
        dy_nose = nose_tip.y - nose_bridge.y
        dz_nose = nose_tip.z - nose_bridge.z
        rotation_x = np.arctan2(dy_nose, np.sqrt(dx_nose**2 + dz_nose**2))
        
        # Angle de rotation (roll) basé sur l'angle entre les yeux
        dx_eyes = right_eye_center_x - left_eye_center_x
        dy_eyes = right_eye_center_y - left_eye_center_y
        rotation_z = np.arctan2(dy_eyes, dx_eyes)
        
        print(f"Calculated rotation: x={rotation_x}, y={rotation_y}, z={rotation_z}")
        
        # Échelle
        # Distance entre les yeux pour la largeur
        eye_distance = np.sqrt(dx_eyes**2 + dy_eyes**2) * width
        # Distance verticale pour la hauteur
        eye_height = abs(nose_bridge.y - nose_tip.y) * height * 0.5
        
        scale_x = eye_distance / 100  # Largeur
        scale_y = eye_height / 50    # Hauteur
        scale_z = (scale_x + scale_y) / 2  # Profondeur moyenne
        
        print(f"Calculated scale: x={scale_x}, y={scale_y}, z={scale_z}")
        
        return GlassesPosition(
            position=Point3D(x=pos_x * width, y=pos_y * height, z=pos_z * 1000),
            rotation=Point3D(x=rotation_x, y=rotation_y, z=rotation_z),
            scale=Point3D(x=scale_x, y=scale_y, z=scale_z)
        ) 