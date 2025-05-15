const { Task } = require('../models');
const logger = require('../utils/logger');

// Récupérer toutes les tâches
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      order: [['createdAt', 'DESC']]
    });
    return res.json(tasks);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des tâches: ${error.message}`);
    return res.status(500).json({ error: 'Erreur lors de la récupération des tâches' });
  }
};

// Récupérer une tâche par ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }
    return res.json(task);
  } catch (error) {
    logger.error(`Erreur lors de la récupération de la tâche: ${error.message}`);
    return res.status(500).json({ error: 'Erreur lors de la récupération de la tâche' });
  }
};

// Créer une nouvelle tâche
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, dueDate, priority } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Le titre est obligatoire' });
    }
    const task = await Task.create({
      title,
      description,
      status,
      dueDate,
      priority
    });
    
    return res.status(201).json(task);
  } catch (error) {
    logger.error(`Erreur lors de la création de la tâche: ${error.message}`);
    return res.status(500).json({ error: 'Erreur lors de la création de la tâche' });
  }
};

// Mettre à jour une tâche
exports.updateTask = async (req, res) => {
  try {
    const { title, description, status, dueDate, priority } = req.body;
    const task = await Task.findByPk(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }
    
    await task.update({
      title: title || task.title,
      description: description !== undefined ? description : task.description,
      status: status || task.status,
      dueDate: dueDate !== undefined ? dueDate : task.dueDate,
      priority: priority || task.priority
    });
    
    return res.json(task);
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de la tâche: ${error.message}`);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour de la tâche' });
  }
};

// Supprimer une tâche
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    await task.destroy();
    return res.status(204).send();
  } catch (error) {
    logger.error(`Erreur lors de la suppression de la tâche: ${error.message}`);
    return res.status(500).json({ error: 'Erreur lors de la suppression de la tâche' });
  }
};