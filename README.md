# 🏭 Optical Factory

> Plateforme d'essayage virtuel et de recommandation de lunettes

## 📑 Table des matières
- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Services](#services)
- [Développement](#développement)
- [Documentation](#documentation)

## 🔭 Vue d'ensemble

Optical Factory est une plateforme moderne permettant aux utilisateurs d'essayer virtuellement des lunettes et de recevoir des recommandations personnalisées. Le projet utilise une architecture microservices avec des technologies de pointe.

## 🏗 Architecture

Le projet est structuré en plusieurs services indépendants :

```
📦 Optical Factory
├── 🖥️ Front-end (React) - Port 3000
├── 🌐 Gateway (FastAPI) - Port 8000
├── 🎭 Service d'Essayage - Port 8001
├── 💡 Service de Recommandation - Port 8002
└── 📊 Portainer (Monitoring) - Port 9000
```

Pour plus de détails sur l'architecture, consultez [ARCHITECTURE.md](./ARCHITECTURE.md).

## ⚙️ Prérequis

- Docker Engine
- Docker Compose
- Make (optionnel)

## 🚀 Installation

1. Clonez le dépôt :
```bash
git clone https://github.com/votre-repo/optical-factory.git
cd optical-factory
```

2. Lancez l'environnement complet :
```bash
cd infra
docker-compose up --build -d
```

## 🔌 Services

| Service | URL | Description |
|---------|-----|-------------|
| Front-end | [http://localhost:3000](http://localhost:3000) | Interface utilisateur |
| Gateway | [http://localhost:8000](http://localhost:8000) | API Gateway |
| Essayage | [http://localhost:8001](http://localhost:8001) | Service d'essayage virtuel |
| Recommandation | [http://localhost:8002](http://localhost:8002) | Système de recommandation |
| Portainer | [http://localhost:9000](http://localhost:9000) | Interface de monitoring |

## 🔐 Authentification

Le front-end utilise Firebase Authentication. Voici les identifiants par défaut :

- **Email** : admin@optic.fr
- **Mot de passe** : adminadmin


## 💻 Développement

### Utilisation du conteneur de développement

```bash
cd infra
docker-compose run dev
```

### Commandes Make disponibles

| Commande | Description |
|----------|-------------|
| `make up` | Lance un service |
| `make down` | Arrête un service |
| `make build` | Reconstruit l'image |
| `make logs` | Affiche les logs |

### Structure du projet

```
📁 infra/
  ├── docker-compose.yml
  └── dev/
📁 workspace/
  ├── front-end/
  ├── gateway/
  ├── essayage/
  └── recommandation/
```

## 📚 Documentation

- [Architecture du système](./docs/architecture/) - Diagrammes et description des composants
- [Documentation API](./docs/api/) - Spécifications des endpoints et exemples
- [Guide de déploiement](./docs/deployment/) - Procédures d'installation et configuration
- [Guide du développeur](./docs/development/) - Standards et procédures de développement

Pour plus de détails, consultez notre [documentation complète](./docs/README.md).

## 🛑 Arrêt des services

Pour arrêter tous les services :
```bash
cd infra
docker-compose down
```

## 🔒 Sécurité

- API Gateway sécurisée
- Services isolés dans des conteneurs
- Monitoring en temps réel

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez notre [guide de contribution](./CONTRIBUTING.md) pour plus d'informations.

---

<div align="center">
Développé avec ❤️ par l'équipe Optical Factory
</div>
