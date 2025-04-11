# API d'Essayage Virtuel de Lunettes

API FastAPI pour la détection faciale et le positionnement de lunettes virtuelles.

## Prérequis

- Python 3.9+
- Docker
- Docker Compose

## Installation

```bash
# Cloner le projet
git clone https://github.com/LoicChazeau/Projet-spe-3/tree/develop

# Se déplacer dans le dossier
cd essayage

# Construire et démarrer les conteneurs
docker-compose up --build
```

## Structure du Projet

```
essayage/
├── app/
│   ├── models/         # Modèles de données Pydantic
│   ├── routers/        # Routes FastAPI
│   ├── services/       # Services métier
│   └── utils/          # Utilitaires
├── tests/              # Tests unitaires
└── requirements.txt    # Dépendances Python
```

## Documentation API

La documentation complète de l'API est disponible via Swagger UI :
- http://localhost:8001/docs
- http://localhost:8001/redoc

## Endpoints Principaux

- `POST /api/face/detect` : Détection faciale et calcul de la position des lunettes
- `WS /ws/face-detection` : WebSocket pour la détection en temps réel

## Technologies

- FastAPI
- MediaPipe Face Mesh
- OpenCV
- WebSocket 

## Tests

Le projet inclut trois modules de tests unitaires :

### test_api.py
Tests des endpoints de l'API :
- Vérification de l'accessibilité des endpoints
- Tests de la détection faciale
- Tests du WebSocket
- Gestion des erreurs

### test_face_detector.py
Tests du service de détection faciale :
- Initialisation du détecteur
- Calcul de la position des lunettes
- Détection de l'absence de visage
- Validation de la qualité de détection

### test_models.py
Tests des modèles de données :
- Validation des points 2D et 3D
- Validation des landmarks faciaux
- Validation de la position des lunettes
- Contraintes métier

Pour exécuter les tests :
```bash
# Dans le conteneur Docker
docker exec -e PYTHONPATH=/app infra-essayage-1 pytest /app/tests/unit/ -v
``` 