const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { sequelize } = require('./models');
const routes = require('./routes');
const logger = require('./utils/logger');

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Journalisation des requêtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes API
app.use('/api', routes);

// Route racine pour l'application web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Erreur serveur', message: err.message });
});

// Fonction pour tenter une connexion à la base de données avec réessais
const connectWithRetry = async (retries = 5, delay = 5000) => {
  let currentTry = 0;
  
  while (currentTry < retries) {
    try {
      await sequelize.authenticate();
      logger.info('Connexion à la base de données établie');
      await sequelize.sync();
      return true;
    } catch (err) {
      currentTry += 1;
      logger.warn(`Tentative de connexion ${currentTry}/${retries} échouée: ${err.message}`);
      
      if (currentTry === retries) {
        logger.error(`Échec de connexion à la base de données après ${retries} tentatives: ${err.message}`);
        return false;
      }
      
      logger.info(`Nouvel essai dans ${delay/1000} secondes...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Démarrage du serveur
if (process.env.NODE_ENV !== 'test') {
  connectWithRetry()
    .then(connected => {
      // Démarrer le serveur même si la connexion échoue
      app.listen(PORT, () => {
        logger.info(`Serveur démarré sur le port ${PORT}`);
        if (!connected) {
          logger.warn('Le serveur a démarré mais sans connexion à la base de données. Certaines fonctionnalités ne seront pas disponibles.');
        }
      });
    });
}

module.exports = app;