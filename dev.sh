#!/bin/bash

# Script pour lancer l'application en mode développement

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "Docker n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "Création du fichier .env à partir de .env.example..."
    cp .env.example .env
fi

# Créer le dossier logs s'il n'existe pas
mkdir -p logs

# Fonction pour arrêter l'application
stop_app() {
    echo "Arrêt de l'application..."
    docker-compose down
    exit 0
}

# Démarrer en mode détaché
echo "Démarrage des conteneurs en arrière-plan..."
docker-compose up -d --build

if [ $? -ne 0 ]; then
    echo "Erreur lors du démarrage des conteneurs."
    exit 1
fi

echo "L'application est lancée sur http://localhost:3000"
echo "Appuyez sur Ctrl+C pour arrêter l'application"

# Attacher signal Ctrl+C
trap stop_app INT

# Afficher les logs en temps réel
docker-compose logs -f

# Si les logs se terminent pour une raison quelconque, arrêter proprement
stop_app