# Architecture du projet optical factory

## Vue d'ensemble

```
+------------+     +---------+     +-------------------+
|  Front-end |---->| Gateway |---->| Service Essayage  |
+------------+     +---------+     +-------------------+
                       |
                       |           +----------------------+
                       +---------->| Service Recommandation|
                                  +----------------------+

+-----------+     +------------+
| Portainer |---->| Monitoring |
+-----------+     +------------+

+---------+     +----------------+
|  CI/CD  |---->| GitHub Actions |
+---------+     +----------------+

+------------+     +--------------------+
| Benchmark  |---->| Tests Performance  |
+------------+     +--------------------+
```

## Composants principaux

### 1. Front-end
- **Technologie** : React
- **Port** : 3000
- **Responsabilité** : Interface utilisateur pour l'essayage virtuel et les recommandations

### 2. Gateway
- **Technologie** : FastAPI
- **Port** : 8000
- **Responsabilité** : Point d'entrée unique pour les requêtes API

### 3. Services backend
#### Service d'Essayage
- **Technologie** : FastAPI
- **Port** : 8001
- **Responsabilité** : Gestion de l'essayage virtuel des lunettes

#### Service de Recommandation
- **Technologie** : FastAPI
- **Port** : 8002
- **Responsabilité** : Système de recommandation de lunettes

### 4. Infrastructure
#### Docker
- **Configuration** : Docker Compose
- **Services** : 
  - Front-end
  - Gateway
  - Services Backend
  - Portainer
  - Conteneur de développement

#### Monitoring
- **Outils** : Portainer
- **Port** : 9000
- **Responsabilité** : Surveillance des conteneurs et des performances

### 5. CI/CD
- **Plateforme** : GitHub Actions
- **Workflows** :
  - Déploiement automatique
  - Tests automatisés
  - Intégration continue

### 6. Benchmark
- **Objectif** : Tests de performance
- **Métriques** : Temps de réponse, utilisation des ressources

## Communication entre services

```
Client        Front-end        Gateway         Services
  |               |              |                |
  |    HTTP       |              |                |
  |-------------->|              |                |
  |               |    API Call  |                |
  |               |------------->|                |
  |               |              |    Request     |
  |               |              |--------------->|
  |               |              |                |
  |               |              |    Response    |
  |               |              |<---------------|
  |               |   Response   |                |
  |               |<-------------|                |
  |    Rendu      |              |                |
  |<--------------|              |                |
  |               |              |                |
```

## Environnement de développement

- **Conteneur de développement** : Environnement unifié pour le développement
- **Volumes** : Persistance des données et partage de code
- **Makefiles** : Automatisation des tâches courantes

## Sécurité

- **API Gateway** : Point d'entrée unique avec validation
- **Isolation** : Services conteneurisés
- **Monitoring** : Surveillance en temps réel via Portainer

## Évolutivité

- Architecture microservices
- Déploiement conteneurisé
- CI/CD automatisée
- Tests de performance réguliers 