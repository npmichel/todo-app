// Configuration de l'API
const API_URL = '/api';

// DOM Elements
const tasksList = document.getElementById('tasks-list');
const addTaskForm = document.getElementById('add-task-form');
const editTaskForm = document.getElementById('edit-task-form');
const modal = document.getElementById('task-modal');
const closeModalBtn = document.querySelector('.close');
const statusFilter = document.getElementById('status-filter');

// Formatage de la date
function formatDate(dateString) {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR').format(date);
}

// Traduction des statuts
function translateStatus(status) {
    const statusMap = {
        'todo': 'À faire',
        'in_progress': 'En cours',
        'done': 'Terminé'
    };
    return statusMap[status] || status;
}

// Traduction des priorités
function translatePriority(priority) {
    const priorityMap = {
        'low': 'Basse',
        'medium': 'Moyenne',
        'high': 'Haute'
    };
    return priorityMap[priority] || priority;
}

// Récupérer toutes les tâches
async function fetchTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`);
        if (!response.ok) throw new Error('Erreur lors de la récupération des tâches');
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Impossible de récupérer les tâches');
        return [];
    }
}

// Afficher les tâches dans la liste
function displayTasks(tasks, filter = 'all') {
    tasksList.innerHTML = '';
    
    const filteredTasks = filter === 'all' 
        ? tasks 
        : tasks.filter(task => task.status === filter);
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<li class="task-item">Aucune tâche trouvée</li>';
        return;
    }
    
    filteredTasks.forEach(task => {
        const taskElement = document.createElement('li');
        taskElement.className = 'task-item';
        taskElement.dataset.id = task.id;
        
        taskElement.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description || 'Aucune description'}</p>
            <div class="task-meta">
                <span class="status status-${task.status}">Statut: ${translateStatus(task.status)}</span>
                <span class="priority priority-${task.priority}">Priorité: ${translatePriority(task.priority)}</span>
            </div>
            <div class="task-meta">
                <span>Créée le: ${formatDate(task.createdAt)}</span>
                <span>Échéance: ${formatDate(task.dueDate)}</span>
            </div>
            <div class="task-actions">
                <button class="btn btn-edit" data-id="${task.id}">Modifier</button>
                <button class="btn btn-delete" data-id="${task.id}">Supprimer</button>
            </div>
        `;
        
        tasksList.appendChild(taskElement);
    });
    
    // Ajouter les écouteurs d'événements pour les boutons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', e => {
            const taskId = e.target.dataset.id;
            openEditTaskModal(taskId);
        });
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', e => {
            const taskId = e.target.dataset.id;
            if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
                deleteTask(taskId);
            }
        });
    });
}

// Créer une nouvelle tâche
async function createTask(taskData) {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) throw new Error('Erreur lors de la création de la tâche');
        
        // Actualiser la liste des tâches
        loadTasks();
        return true;
    } catch (error) {
        console.error('Erreur:', error);
        alert('Impossible de créer la tâche');
        return false;
    }
}

// Récupérer une tâche par ID
async function fetchTaskById(id) {
    try {
        const response = await fetch(`${API_URL}/tasks/${id}`);
        if (!response.ok) throw new Error('Erreur lors de la récupération de la tâche');
        return await response.json();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Impossible de récupérer les détails de la tâche');
        return null;
    }
}

// Mettre à jour une tâche
async function updateTask(id, taskData) {
    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) throw new Error('Erreur lors de la mise à jour de la tâche');
        
        // Actualiser la liste des tâches
        loadTasks();
        return true;
    } catch (error) {
        console.error('Erreur:', error);
        alert('Impossible de mettre à jour la tâche');
        return false;
    }
}

// Supprimer une tâche
async function deleteTask(id) {
    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erreur lors de la suppression de la tâche');
        
        // Actualiser la liste des tâches
        loadTasks();
        return true;
    } catch (error) {
        console.error('Erreur:', error);
        alert('Impossible de supprimer la tâche');
        return false;
    }
}

// Ouvrir la modal pour modifier une tâche
async function openEditTaskModal(id) {
    const task = await fetchTaskById(id);
    if (!task) return;
    
    // Remplir le formulaire avec les données de la tâche
    document.getElementById('edit-id').value = task.id;
    document.getElementById('edit-title').value = task.title;
    document.getElementById('edit-description').value = task.description || '';
    document.getElementById('edit-status').value = task.status;
    document.getElementById('edit-priority').value = task.priority;
    
    // Formater la date pour l'input date
    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const formattedDate = dueDate.toISOString().split('T')[0];
        document.getElementById('edit-dueDate').value = formattedDate;
    } else {
        document.getElementById('edit-dueDate').value = '';
    }
    
    // Afficher la modal
    modal.style.display = 'block';
}

// Charger les tâches et les afficher
async function loadTasks() {
    const tasks = await fetchTasks();
    const currentFilter = statusFilter.value;
    displayTasks(tasks, currentFilter);
}

// Écouteurs d'événements
document.addEventListener('DOMContentLoaded', () => {
    // Charger les tâches au chargement de la page
    loadTasks();
    
    // Soumission du formulaire d'ajout
    addTaskForm.addEventListener('submit', e => {
        e.preventDefault();
        
        const formData = new FormData(addTaskForm);
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            status: formData.get('status'),
            dueDate: formData.get('dueDate') || null,
            priority: formData.get('priority')
        };
        
        createTask(taskData).then(success => {
            if (success) {
                addTaskForm.reset();
            }
        });
    });
    
    // Soumission du formulaire de modification
    editTaskForm.addEventListener('submit', e => {
        e.preventDefault();
        
        const id = document.getElementById('edit-id').value;
        const formData = new FormData(editTaskForm);
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            status: formData.get('status'),
            dueDate: formData.get('dueDate') || null,
            priority: formData.get('priority')
        };
        
        updateTask(id, taskData).then(success => {
            if (success) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Fermer la modal
    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', e => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Filtrer les tâches
    statusFilter.addEventListener('change', () => {
        loadTasks();
    });
});