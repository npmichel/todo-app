const { Task } = require('../../models');

// Mock de Sequelize pour les tests unitaires des modèles
jest.mock('../../models', () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  
  const TaskMock = dbMock.define('Task', {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    priority: 'medium',
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return { 
    Task: TaskMock,
    sequelize: dbMock
  };
});

const taskController = require('../../controllers/taskController');

describe('Task Controller', () => {
  let req, res;
  
  beforeEach(() => {
    req = {
      params: {},
      body: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
  });
  
  describe('getAllTasks', () => {
    it('devrait récupérer toutes les tâches', async () => {
      await taskController.getAllTasks(req, res);
      
      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0];
      expect(Array.isArray(result)).toBeTruthy();
    });
  });
  
  describe('getTaskById', () => {
    it('devrait récupérer une tâche par son ID', async () => {
      req.params.id = 'task-123';
      
      await taskController.getTaskById(req, res);
      
      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0];
      expect(result).toHaveProperty('id', 'task-123');
    });
    
    it('devrait renvoyer une erreur 404 si la tâche n\'existe pas', async () => {
      req.params.id = 'non-existent-id';
      
      // Pour simuler une tâche non trouvée
      jest.spyOn(Task, 'findByPk').mockResolvedValueOnce(null);
      
      await taskController.getTaskById(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
    });
  });
  
  describe('createTask', () => {
    it('devrait créer une nouvelle tâche avec succès', async () => {
      req.body = {
        title: 'New Task',
        description: 'New Description',
        status: 'todo',
        priority: 'high'
      };
      
      await taskController.createTask(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });
    
    it('devrait renvoyer une erreur 400 si le titre est manquant', async () => {
      req.body = {
        description: 'New Description',
        status: 'todo',
        priority: 'high'
      };
      
      await taskController.createTask(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
    });
  });
  
  describe('updateTask', () => {
    it('devrait mettre à jour une tâche existante', async () => {
      req.params.id = 'task-123';
      req.body = {
        title: 'Updated Task',
        status: 'in_progress'
      };
      
      await taskController.updateTask(req, res);
      
      expect(res.json).toHaveBeenCalled();
    });
    
    it('devrait renvoyer une erreur 404 si la tâche n\'existe pas', async () => {
      req.params.id = 'non-existent-id';
      req.body = {
        title: 'Updated Task'
      };
      
      // Pour simuler une tâche non trouvée
      jest.spyOn(Task, 'findByPk').mockResolvedValueOnce(null);
      
      await taskController.updateTask(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
    });
  });
  
  describe('deleteTask', () => {
    it('devrait supprimer une tâche existante', async () => {
      req.params.id = 'task-123';
      
      await taskController.deleteTask(req, res);
      
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
    
    it('devrait renvoyer une erreur 404 si la tâche n\'existe pas', async () => {
      req.params.id = 'non-existent-id';
      
      // Pour simuler une tâche non trouvée
      jest.spyOn(Task, 'findByPk').mockResolvedValueOnce(null);
      
      await taskController.deleteTask(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
    });
  });
});