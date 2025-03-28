# Makefile pour lancer docker-compose up -d avec la commande "update"
# et exécuter une commande de sauvegarde avec la commande "backup" à la fin de "update"
# Nom du fichier docker-compose.yml
DOCKER_COMPOSE_FILE := docker-compose.yml
# Cible par défaut
default: up
# Règle pour la cible "pull"
pull:
	docker compose -f $(DOCKER_COMPOSE_FILE) pull
# Règle pour la cible "up"
up:
	docker compose -f $(DOCKER_COMPOSE_FILE) up -d
# Règle pour la cible "restart"
restart:
	@make down
	@make up
# Règle pour la cible "logs"
logs:
	docker compose -f $(DOCKER_COMPOSE_FILE) logs
# Règle pour la cible "down"
down:
	docker compose -f $(DOCKER_COMPOSE_FILE) down
# Règle pour la cible "update"
update:
	@make pull
	@make down
	@make up