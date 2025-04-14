# Projet spécialisation 3 - Optical Factory

## Structure
- **infra/** : Contient le fichier docker-compose global et un conteneur de développement (dev).
- **workspace/** : Contient les services (front-end, gateway, essayage, recommandation, etc.).

## Prérequis
- Docker et Docker Compose installés sur votre machine.

## Lancer le projet avec Docker
1. Clonez le dépôt et placez-vous à la racine.
2. Depuis le dossier **infra/**, lancez :
   ```bash
   docker-compose up --build -d
   ```
   Cela lancera tous les services :
   - Front-end sur [http://localhost:3000](http://localhost:3000)
   - Gateway sur [http://localhost:8000](http://localhost:8000)
   - Essayage sur [http://localhost:8001](http://localhost:8001)
   - Recommandation sur [http://localhost:8002](http://localhost:8002)
   - Portainer sur [http://localhost:9000](http://localhost:9000)

## Utiliser le conteneur de développement (dev)
Si vous n'avez pas Make installé sur votre machine, vous pouvez utiliser le conteneur de développement pour lancer les commandes Make :
1. Depuis **infra/**, lancez :
   ```bash
   docker-compose run dev
   ```
2. Vous obtiendrez un shell où vous pouvez utiliser des commandes Make (ex: `make up`, `make down`) pour gérer individuellement les services.

## Makefiles
Chaque service dans **workspace/** possède un Makefile qui simplifie l'exécution de commandes courantes (build, up, down, logs). Vous pouvez :
- Utiliser `make up` pour lancer un service.
- Utiliser `make down` pour l'arrêter.
- Utiliser `make build` pour reconstruire l'image du service.

## Arrêter tous les services
Depuis **infra/**, exécutez :
```bash
docker-compose down
```
