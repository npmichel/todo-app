#!/bin/bash
# Script d'installation des prérequis communs (Docker, Git) pour Ubuntu 22.04

set -e

echo "=== Installation des prérequis communs ==="

# Mise à jour des packages
apt-get update
apt-get upgrade -y

# Installation des dépendances
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common

# Installation de Docker avec le dépôt officiel pour Ubuntu 22.04
echo "=== Installation de Docker ==="
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Configuration de Docker
usermod -aG docker vagrant
systemctl enable docker
systemctl start docker

# Installation de Docker Compose v2
echo "=== Installation de Docker Compose ==="
apt-get install -y docker-compose-plugin
ln -s /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose

# Installation de Git
echo "=== Installation de Git ==="
apt-get install -y git

# Installation de Nginx
echo "=== Installation de NGINX ==="
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

# Configuration du fichier de swap pour améliorer les performances
echo "=== Configuration du swap ==="
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab