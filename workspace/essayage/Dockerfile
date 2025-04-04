FROM python:3.9-slim

# Installer les dépendances système nécessaires pour OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier et installer les dépendances Python
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

# Copier le script d'entrée
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8001
CMD ["/app/entrypoint.sh"]
