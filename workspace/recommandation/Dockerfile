FROM python:3.9-slim

WORKDIR /app

# Installer les dépendances système nécessaires pour OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Créer le dossier pour les images de test
RUN mkdir -p /app/images-test

# Copier les fichiers de dépendances
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source et les images de test
COPY . .
COPY images-test/* /app/images-test/

# Exposer le port
EXPOSE 8002

# Commande par défaut pour lancer l'application
CMD ["sh", "-c", "python -m app.database.init_db && uvicorn main:app --host 0.0.0.0 --port 8002"]