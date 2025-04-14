# Guide de développement

## Structure du projet

Le projet est une application composée de plusieurs services :

```
Projet-spe-3/
├── workspace/
│   ├── essayage/          # Service d'essayage virtuel
│   ├── recommandation/    # Service de recommandation
│   ├── front-end/         # Interface utilisateur React
│   ├── gateway/           # API Gateway
│   └── portainer/         # Interface de gestion Docker
└── infra/
    └── docker-compose.yml # Configuration Docker
```

## Technologies utilisées

### Service d'Essayage
- Python 3.9
- FastAPI
- PyTorch
- OpenCV
- MediaPipe
- Tests avec pytest

### Service de Recommandation
- Python 3.9
- FastAPI
- TensorFlow
- OpenCV
- SQLAlchemy
- PostgreSQL

### Front-end
- React 19
- Three.js (3D)
- Firebase (Authentification)
- React Router (Navigation)

### Gateway
- Python 3.9
- FastAPI
- Configuration minimale

## Configuration de l'environnement de développement

### Prérequis
- Docker
- Docker Compose
- Git
- Cursor (IDE recommandé)

### Installation

1. **Cloner le dépôt** :
   ```bash
   git clone https://github.com/votre-org/Projet-spe-3.git
   cd Projet-spe-3
   ```

2. **Lancer les services** :
   ```bash
   # Depuis le dossier infra
   cd infra
   docker-compose up -d

   # Ou individuellement pour chaque service
   cd workspace/<service>
   make up
   ```

## Workflow de développement

### Gestion des branches
- `main` : Production
- `develop` : Préproduction
- `feature/*` : Nouvelles fonctionnalités
- `hotfix/*` : Corrections urgentes

### Convention de commits
Utilisation de Conventional Commits :
```
feat: ajout d'une nouvelle fonctionnalité
fix: correction d'un bug
docs: modification de la documentation
style: modifications de formatage
refactor: refactorisation du code
test: ajout ou modification de tests
chore: tâches de maintenance
```

## Développement par service

### Service d'Essayage

#### Structure
```
essayage/
├── app/
│   ├── routers/      # Routes API
│   ├── models/       # Modèles de données
│   └── services/     # Logique métier
├── tests/
│   └── unit/         # Tests unitaires
└── main.py           # Point d'entrée
```

#### Commandes
```bash
# Lancer le service
make up

# Arrêter le service
make down

# Voir les logs
make logs

# Lancer les tests
docker exec infra-essayage-1 pytest /app/tests/unit/ -v
```

#### Documentation
- Swagger UI disponible sur `/docs`
- Docstrings au format FastAPI

### Service de Recommandation

#### Structure
```
recommandation/
├── main.py           # Point d'entrée
├── database.py       # Configuration DB
└── init_db.py        # Initialisation DB
```

#### Commandes
```bash
# Lancer le service
make up

# Arrêter le service
make down

# Voir les logs
make logs
```

### Front-end

#### Structure
```
front-end/
├── src/
│   ├── components/   # Composants React
│   ├── pages/        # Pages de l'application
│   ├── assets/       # Ressources statiques
│   ├── App.js        # Composant principal
│   └── firebase.js   # Configuration Firebase
└── public/           # Fichiers statiques
```

#### Commandes
```bash
# Développement
npm start

# Build
npm run build

# Tests
npm test
```

## Tests

### Service d'Essayage
Tests unitaires disponibles dans `tests/unit/` :
- `test_api.py` : Tests des endpoints API
- `test_face_detector.py` : Tests de la détection faciale
- `test_models.py` : Tests des modèles de données

Pour lancer les tests :
```bash
docker exec infra-essayage-1 pytest /app/tests/unit/ -v
```

### Front-end
Tests avec React Testing Library :
```bash
npm test
```

## Documentation du code

### Python (FastAPI)
Utilisation de docstrings :
```python
@router.post("/detect")
async def detect_face_landmarks(image: UploadFile = File(...)):
    """
    Détecte les points de repère du visage et calcule la position optimale des lunettes.
    
    Args:
        image: Fichier image à analyser
        
    Returns:
        FaceAnalysisResponse: Réponse contenant les landmarks et la position des lunettes
    """
```

### Documentation des API
- Swagger UI disponible sur `/docs` de chaque service
- Documentation automatique générée par FastAPI

## Bonnes pratiques

### Général
- Suivre les conventions de nommage Python
- Documenter les fonctions complexes
- Écrire des tests pour les nouvelles fonctionnalités

### Front-end
- Utiliser des composants fonctionnels
- Gérer l'état avec des hooks React
- Suivre les conventions de nommage React

### Back-end
- Valider les entrées avec Pydantic
- Gérer les erreurs de manière appropriée
- Utiliser des types pour les données

## Dépannage

### Problèmes courants

1. **Services non accessibles** :
   ```bash
   # Vérifier les logs
   make logs
   
   # Vérifier l'état des conteneurs
   docker-compose ps
   ```

2. **Problèmes de build** :
   ```bash
   # Nettoyer les images
   docker-compose down
   docker system prune -a
   
   # Reconstruire
   docker-compose up --build
   ```

3. **Problèmes de tests** :
   ```bash
   # Vérifier les logs des tests
   docker exec infra-essayage-1 pytest /app/tests/unit/ -v
   ```

## Ressources utiles

- [Documentation FastAPI](https://fastapi.tiangolo.com/)
- [Documentation React](https://reactjs.org/docs/getting-started.html)
- [Documentation Docker](https://docs.docker.com/)
- [Conventional Commits](https://www.conventionalcommits.org/) 