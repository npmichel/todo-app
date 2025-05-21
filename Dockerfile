# Utiliser une image Node.js officielle comme base
FROM node:20-alpine

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code source de l'application
COPY . .

# Exposition du port utilisé par l'application
EXPOSE 3000

# Commande par défaut pour démarrer l'application
CMD ["npm", "start"]