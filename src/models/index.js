const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Configuration de la connexion à PostgreSQL via Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'todo_app',
  process.env.DB_USERNAME || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: msg => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import des modèles
const Task = require('./task')(sequelize);

// Relations entre les modèles (à ajouter si nécessaire)
// Par exemple: User.hasMany(Task);

module.exports = {
  sequelize,
  Task
};