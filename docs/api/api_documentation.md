# Documentation des API

## Vue d'ensemble

Le système expose plusieurs API REST pour différentes fonctionnalités. Toutes les requêtes passent par l'API Gateway (port 8000) qui route les requêtes vers les services appropriés.

## Authentification

Toutes les API nécessitent une authentification via un token JWT dans le header de la requête :

```
Authorization: Bearer <token>
```

## Endpoints

### Service d'Essayage (Port 8001)

#### GET /
Vérification de l'état du service.

**Requête**
```http
GET /
```

**Réponse**
```json
{
    "status": "healthy",
    "service": "Essayage API",
    "version": "1.0.0"
}
```

#### GET /api/v1/face/test
Test de la détection faciale.

**Requête**
```http
GET /api/v1/face/test
```

**Réponse**
```json
{
    "status": "Face detection service is running"
}
```

#### POST /api/v1/face/detect
Détection des points du visage et calcul de la position optimale des lunettes.

**Requête**
```http
POST /api/v1/face/detect
Content-Type: multipart/form-data

file: <image_file>
```

**Réponse**
```json
{
    "success": true,
    "message": "Face landmarks and glasses position calculated successfully",
    "landmarks": {
        // Points de repère du visage
    },
    "glasses_position": {
        // Position optimale des lunettes
    }
}
```

#### WS /api/v1/face/ws
WebSocket pour la détection faciale en temps réel.

**Connexion**
```javascript
const ws = new WebSocket('ws://localhost:8001/api/v1/face/ws');
```

**Envoi de données**
```javascript
// Envoyer une image en base64
ws.send(base64Image);
```

**Réception de données**
```json
{
    "success": true,
    "landmarks": {
        // Points de repère du visage
    },
    "glasses_position": {
        // Position optimale des lunettes
    }
}
```

### Service de Recommandation (Port 8002)

#### GET /
Vérification de l'état du service.

**Requête**
```http
GET /
```

#### POST /analyze
Analyse d'une image de visage et recommandation de lunettes.

**Requête**
```http
POST /analyze
Content-Type: multipart/form-data

file: <image_file>
```

**Réponse**
```json
{
    "face_analysis": {
        // Analyse du visage
    },
    "recommendations": [
        {
            "id": "string",
            "name": "string",
            "brand": "string",
            "price": number,
            "image_url": "string",
            "match_score": number
        }
    ]
}
```

#### GET /glasses
Récupération de toutes les lunettes disponibles.

**Requête**
```http
GET /glasses
```

**Réponse**
```json
[
    {
        "id": "string",
        "name": "string",
        "brand": "string",
        "price": number,
        "image_url": "string",
        "category": "string"
    }
]
```

#### GET /glasses/{category}
Récupération des lunettes par catégorie.

**Requête**
```http
GET /glasses/classique
```

**Réponse**
```json
[
    {
        "id": "string",
        "name": "string",
        "brand": "string",
        "price": number,
        "image_url": "string",
        "category": "string"
    }
]
```

#### GET /styles
Récupération de tous les styles disponibles.

**Requête**
```http
GET /styles
```

**Réponse**
```json
[
    "classique",
    "moderne",
    "sport",
    // ...
]
```

## Codes d'erreur

| Code | Description |
|------|-------------|
| 400 | Requête invalide |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

## Exemple d'utilisation

### Essayage virtuel
1. Upload d'une photo
2. Récupération de l'URL de l'essayage
3. Affichage du résultat

### Recommandation
1. Spécification des critères
2. Récupération des recommandations
3. Feedback sur les recommandations

## Limitations

- Taille maximale des images : 5MB
- Formats d'image acceptés : JPEG, PNG
- Rate limiting : 100 requêtes par minute par IP 

## Modèles de données

### Service d'Essayage

#### FaceLandmarks
```json
{
    "left_eye": {
        "x": number,
        "y": number
    },
    "right_eye": {
        "x": number,
        "y": number
    },
    "nose": {
        "x": number,
        "y": number
    }
}
```

#### GlassesPosition
```json
{
    "position": {
        "x": number,
        "y": number,
        "rotation": number
    },
    "scale": number
}
```

### Service de Recommandation

#### Glasses
```json
{
    "id": "string",
    "name": "string",
    "brand": "string",
    "price": number,
    "image_url": "string",
    "category": "string",
    "style": "string",
    "face_shapes": ["string"],
    "colors": ["string"]
}
```

#### FaceAnalysis
```json
{
    "face_shape": "string",
    "skin_tone": "string",
    "features": {
        "face_width": number,
        "face_length": number,
        "jaw_width": number
    }
}
``` 