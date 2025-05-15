const request = require('supertest');
const app = require('../../app');
const { Task, sequelize } = require('../../models');

// Configuration pour les tests
beforeAll(async () => {
  // Connexion à la base de données de test
  await sequelize.authenticate();
  // Synchronisation des modèles (force: true pour recréer les tables)
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  // Nettoyage de la table tasks avant chaque test
  await Task.destroy({ where: {}, truncate: true });
});

afterAll(async () => {
  // Fermeture de la connexion après tous les tests
  await sequelize.close();
});

describe('API Tasks', () => {
  // Données de test
  const taskData = {
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    priority: 'medium'
  };

  describe('POST /api/tasks', () => {
    it('devrait créer une nouvelle tâche', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send(taskData);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toEqual(taskData.title);
      expect(res.body.description).toEqual(taskData.description);
      expect(res.body.status).toEqual(taskData.status);
      expect(res.body.priority).toEqual(taskData.priority);
    });

    it('devrait renvoyer une erreur 400 si le titre est manquant', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          description: 'Test Description',
          status: 'todo',
          priority: 'medium'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/tasks', () => {
    it('devrait récupérer toutes les tâches', async () => {
      // Créer des tâches pour le test
      await Task.create(taskData);
      await Task.create({
        ...taskData,
        title: 'Second Task'
      });

      const res = await request(app).get('/api/tasks');
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toEqual(2);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('devrait récupérer une tâche par son ID', async () => {
      // Créer une tâche pour le test
      const task = await Task.create(taskData);

      const res = await request(app).get(`/api/tasks/${task.id}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', task.id);
      expect(res.body.title).toEqual(task.title);
    });

    it('devrait renvoyer une erreur 404 si la tâche n\'existe pas', async () => {
      const res = await request(app).get('/api/tasks/999999');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('devrait mettre à jour une tâche existante', async () => {
      // Créer une tâche pour le test
      const task = await Task.create(taskData);
      
      const updateData = {
        title: 'Updated Task',
        status: 'in_progress'
      };

      const res = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send(updateData);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', task.id);
      expect(res.body.title).toEqual(updateData.title);
      expect(res.body.status).toEqual(updateData.status);
      // Les champs non mis à jour doivent rester inchangés
      expect(res.body.description).toEqual(task.description);
    });

    it('devrait renvoyer une erreur 404 si la tâche n\'existe pas', async () => {
      const res = await request(app)
        .put('/api/tasks/999999')
        .send({ title: 'Updated Task' });
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('devrait supprimer une tâche existante', async () => {
      // Créer une tâche pour le test
      const task = await Task.create(taskData);

      const res = await request(app).delete(`/api/tasks/${task.id}`);
      
      expect(res.statusCode).toEqual(204);
      
      // Vérifier que la tâche a bien été supprimée
      const deletedTask = await Task.findByPk(task.id);
      expect(deletedTask).toBeNull();
    });

    it('devrait renvoyer une erreur 404 si la tâche n\'existe pas', async () => {
      const res = await request(app).delete('/api/tasks/999999');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error');
    });
  });
});