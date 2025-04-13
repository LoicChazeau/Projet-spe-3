import numpy as np
from app.models.face import Point3D

class KalmanFilter3D:
    def __init__(self, process_noise=0.01, measurement_noise=0.01):
        # État : [x, y, z, vx, vy, vz]
        self.state = np.zeros(6)
        self.covariance = np.eye(6)
        
        # Matrice de transition (modèle de mouvement constant)
        self.F = np.array([
            [1, 0, 0, 1, 0, 0],
            [0, 1, 0, 0, 1, 0],
            [0, 0, 1, 0, 0, 1],
            [0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 1]
        ])
        
        # Matrice d'observation (on observe uniquement la position)
        self.H = np.array([
            [1, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0]
        ])
        
        # Bruit de processus et de mesure
        self.Q = np.eye(6) * process_noise
        self.R = np.eye(3) * measurement_noise
        
    def predict(self):
        # Prédiction de l'état
        self.state = self.F @ self.state
        self.covariance = self.F @ self.covariance @ self.F.T + self.Q
        return self.state[:3]  # Retourne uniquement la position
        
    def update(self, measurement):
        # Prédiction avant mise à jour
        self.predict()
        
        # Innovation
        y = measurement - self.H @ self.state
        S = self.H @ self.covariance @ self.H.T + self.R
        
        # Gain de Kalman
        K = self.covariance @ self.H.T @ np.linalg.inv(S)
        
        # Mise à jour
        self.state = self.state + K @ y
        self.covariance = (np.eye(6) - K @ self.H) @ self.covariance
        
        return self.state[:3]  # Retourne uniquement la position
        
    def get_position(self):
        return Point3D(
            x=float(self.state[0]),
            y=float(self.state[1]),
            z=float(self.state[2])
        ) 