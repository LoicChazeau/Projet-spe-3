# Guide de déploiement

## Prérequis

### Serveur de production
- Serveur AWS EC2 avec Ubuntu
- Docker installé
- Docker Compose installé
- Accès SSH configuré
- Secrets GitHub configurés (SERVER_IP, SERVER_USER, SERVER_SSH_KEY)

### Installation des prérequis

```bash
# Installation de Docker
sudo apt-get update
sudo apt-get install docker.io

# Installation de Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Processus de déploiement

### 1. Développement (Branche develop)
- Les développeurs travaillent sur la branche `develop`
- Les changements sont poussés vers GitHub
- Le pipeline CI s'exécute automatiquement :
  - Construction des images Docker
  - Exécution des tests
  - Vérification de la santé des services

### 2. Intégration continue
Le pipeline CI (`ci.yml`) :
1. Vérifie le code
2. Construit les images Docker
3. Lance les tests
4. Si les tests passent sur `develop` :
   - Crée automatiquement une PR vers `main`
   - La PR doit être validée manuellement

### 3. Déploiement en production
Le pipeline de déploiement (`deploy.yml`) :
1. S'exécute automatiquement sur la branche `main`
2. Se connecte au serveur via SSH
3. Exécute les commandes suivantes :
   ```bash
   cd /home/ubuntu/Projet-spe-3
   git pull
   cd infra
   docker-compose down
   docker-compose up --build -d
   ```

## Structure des services

Les services sont déployés sur les ports suivants :
- Front-end : 3000
- Gateway : 8000
- Service d'essayage : 8001
- Service de recommandation : 8002
- Portainer : 9000

## Gestion des secrets

Les secrets sont gérés via GitHub Secrets :
- SERVER_IP : Adresse IP du serveur
- SERVER_USER : Utilisateur SSH
- SERVER_SSH_KEY : Clé SSH pour l'authentification

## Vérification du déploiement

Après le déploiement, vérifiez que tous les services sont en cours d'exécution :
```bash
cd /home/ubuntu/Projet-spe-3/infra
docker-compose ps
```

## Dépannage

### Problèmes Courants

1. **Services non accessibles** :
   ```bash
   # Vérifier les logs
   docker-compose logs
   
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

3. **Problèmes de réseau** :
   ```bash
   # Vérifier les ports
   netstat -tulpn | grep LISTEN
   
   # Vérifier les règles de pare-feu
   sudo ufw status
   ``` 