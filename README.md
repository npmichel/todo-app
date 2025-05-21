# Déploiement Automatisé d'une Application Web de Gestion des Tâches

Application web de gestion de tâches (similaire à Trello) déployée automatiquement via un pipeline CI/CD complet sur Kubernetes, suivant les principes DevOps.

## Technologies

### Application et Infrastructure
- **Frontend/Backend**: Node.js v20.11.1 LTS avec Express 4.18.2
- **Base de données**: PostgreSQL 16.2
- **Serveur web**: NGINX 1.25.4

### DevOps et Infrastructure
- **Conteneurisation**: Docker 26.0.0
- **Orchestration**: Kubernetes 1.29.2
- **Infrastructure as Code**: Vagrant 2.4.1 avec VirtualBox 7.1
- **CI/CD**: Jenkins 2.440.1 avec Blue Ocean
- **Dépôt d'images**: DockerHub

### Outils de développement
- **Tests unitaires**: Jest 29.7.0
- **Linting**: ESLint 8.56.0
- **Documentation API**: Swagger/OpenAPI 3.0
- **ORM**: Sequelize 6.35.1

## Structure du Projet
```
.
├── dev.sh
├── docker-compose.yml
├── Dockerfile
├── docs
├── jenkins
│   └── Jenkinsfile
├── kubernetes
│   ├── app
│   │   ├── configmap.yaml
│   │   ├── deployment.yaml
│   │   ├── ingress.yaml
│   │   └── service.yaml
│   ├── db
│   │   ├── deployment.yaml
│   │   ├── pvc.yaml
│   │   ├── pv.yaml
│   │   └── service.yaml
│   ├── deployment.yaml
│   ├── secrets
│   │   └── db-credentials.yaml
│   └── service.yaml
├── logs
│   ├── combined.log
│   └── error.log
├── package.json
├── README.md
├── scripts
│   └── deploy-kubernetes.sh
├── src
│   ├── app.js
│   ├── controllers
│   │   └── taskController.js
│   ├── models
│   │   ├── index.js
│   │   └── task.js
│   ├── public
│   │   ├── index.html
│   │   ├── script.js
│   │   └── styles.css
│   ├── routes
│   │   └── index.js
│   ├── tests
│   │   ├── integration
│   │   │   └── taskAPI.test.js
│   │   └── unit
│   │       └── taskController.test.js
│   └── utils
│       └── logger.js
└── terraform
    ├── environments
    ├── kubeconfig.txt
    ├── main.tf
    ├── modules
    ├── outputs.tf
    ├── providers.tf
    ├── scripts
    │   ├── install_docker.sh
    │   ├── install_jenkins.sh
    │   ├── install_kubernetes.sh
    │   └── install_nginx.sh
    ├── terraform.tfvars
    ├── vagrant
    │   ├── scripts
    │   │   ├── install_common.sh
    │   │   ├── install_jenkins.sh
    │   │   └── install_kubernetes.sh
    │   └── Vagrantfile
    ├── variables.tf
    └── vms.tf

23 directories, 46 files
```

## Installation & Déploiement

### Prérequis
```bash
# Node.js et npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# VirtualBox
sudo apt install virtualbox

# Vagrant
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install vagrant

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

### Déploiement de l'infrastructure
```bash
# Cloner le dépôt
git clone https://github.com/[username]/todo-app.git
cd todo-app

# Démarrer les VMs
cd terraform/vagrant
vagrant up

# Récupérer les informations de connexion
vagrant ssh-config
```

### Configuration de Jenkins
```bash
# Accéder à Jenkins via le navigateur
# URL: http://192.168.56.10:8080

# Récupérer le mot de passe admin initial
vagrant ssh jenkins -c "cat /home/vagrant/jenkins_password.txt"

# Installer les plugins recommandés
# Créer un compte administrateur
# Configurer les identifiants:
#   - Docker Hub (ID: docker-hub-credentials)
#   - Kubernetes (ID: kubeconfig)

# Créer un pipeline
# - Nouveau Item > Pipeline
# - Configurer le pipeline pour utiliser SCM Git
# - Spécifier l'URL du repository
# - Définir la branche */main
# - Spécifier le chemin du Jenkinsfile: jenkins/Jenkinsfile
```

### Transfert du fichier kubeconfig
```bash
# Sur la VM Kubernetes
sudo cat /etc/kubernetes/admin.conf > ~/kubeconfig.txt

# Transférer le fichier (méthode par partage Vagrant)
cp ~/kubeconfig.txt /vagrant/
# Sur la VM Jenkins
cp /vagrant/kubeconfig.txt ~/
```

### Configuration de Kubernetes
```bash
# Se connecter à la VM Kubernetes
vagrant ssh kubernetes

# Vérifier l'état du cluster
kubectl get nodes
kubectl get pods --all-namespaces

# Vérifier la connectivité du réseau
kubectl get pods -n kube-system
```

## Déploiement Kubernetes

### Architecture Kubernetes
![Architecture Kubernetes](https://i.imgur.com/8xKgjcz.png)

Notre architecture Kubernetes comprend:
- **Application frontend**: Déploiement Node.js avec 2 replicas pour la haute disponibilité
- **Backend database**: PostgreSQL avec stockage persistant
- **ConfigMap**: Pour les variables d'environnement non-sensibles
- **Secrets**: Pour les informations d'authentification sensibles
- **Services**: Pour l'exposition interne et externe des composants
- **Ingress**: Pour accéder à l'application depuis l'extérieur (optionnel)

### Organisation des fichiers Kubernetes
```
kubernetes/
├── app/                  # Application frontend
│   ├── deployment.yaml   # Déploiement de l'application
│   ├── service.yaml      # Service pour exposer l'application
│   ├── configmap.yaml    # Variables d'environnement
│   └── ingress.yaml      # Configuration de l'ingress NGINX
├── db/                   # Base de données PostgreSQL
│   ├── deployment.yaml   # Déploiement de PostgreSQL
│   ├── service.yaml      # Service interne pour PostgreSQL
│   ├── pv.yaml           # Volume persistant
│   └── pvc.yaml          # Claim de volume persistant
└── secrets/
    └── db-credentials.yaml  # Secrets pour les credentials DB
```

### Configuration des composants Kubernetes

#### Secrets
Les informations sensibles comme les identifiants de base de données sont stockées dans des secrets Kubernetes:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: default
type: Opaque
data:
  username: cG9zdGdyZXM=  # postgres encodé en base64
  password: cG9zdGdyZXM=  # postgres encodé en base64
```

#### Volumes persistants
Pour assurer la persistance des données PostgreSQL:

```yaml
# Volume persistant
apiVersion: v1
kind: PersistentVolume
metadata:
  name: postgres-pv
  labels:
    type: local
    app: todo-db
spec:
  storageClassName: manual
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: "/mnt/data/postgres"
  persistentVolumeReclaimPolicy: Retain

# Claim de volume persistant
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: default
  labels:
    app: todo-db
spec:
  storageClassName: manual
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

#### Déploiement de l'application
Le déploiement de l'application TODO utilise:
- 2 replicas pour la haute disponibilité
- Stratégie de mise à jour RollingUpdate
- Sondes de readiness et liveness pour la résilience
- Secrets pour les identifiants de base de données
- Limites de ressources définies

#### Déploiement de la base de données
Le déploiement PostgreSQL utilise:
- Stratégie Recreate (pour éviter les corruptions de données)
- Volume persistant pour le stockage des données
- Sondes de santé spécifiques à PostgreSQL
- Isolation réseau par service ClusterIP

### Déploiement automatisé avec script

Pour faciliter le déploiement manuel (hors pipeline CI/CD), un script `deploy-kubernetes.sh` est fourni:

```bash
# Rendre le script exécutable
chmod +x scripts/deploy-kubernetes.sh

# Déployer l'application sur le namespace par défaut
./scripts/deploy-kubernetes.sh

# Ou déployer sur un namespace spécifique
./scripts/deploy-kubernetes.sh mon-namespace
```

Le script:
1. Déploie les secrets d'abord
2. Crée les volumes persistants
3. Déploie la base de données
4. Déploie l'application
5. Vérifie l'état du déploiement

### Accès à l'application déployée

```bash
# Obtenir le NodePort assigné à l'application
NODE_PORT=$(kubectl get svc todo-app -o jsonpath='{.spec.ports[0].nodePort}')

# Accéder à l'application via NodePort
curl http://192.168.56.11:$NODE_PORT

# Ou via Ingress (si configuré)
# Ajouter d'abord une entrée dans /etc/hosts
echo "192.168.56.11 todo.app.local" | sudo tee -a /etc/hosts
curl http://todo.app.local
```

## Pipeline CI/CD avec Jenkins

### Structure du Jenkinsfile
Le fichier `jenkins/Jenkinsfile` définit le pipeline CI/CD avec les étapes suivantes:

```groovy
pipeline {
    agent any
    
    environment {
        DOCKER_HUB_CREDS = credentials('docker-hub-credentials')
        DOCKER_HUB_USERNAME = "${env.DOCKER_HUB_CREDS_USR}"
        APP_NAME = 'todo-app'
        IMAGE_NAME = "${DOCKER_HUB_USERNAME}/${APP_NAME}"
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        
        stage('Run Tests') {
            steps {
                sh 'npm test'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
                sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest"
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                sh "echo ${DOCKER_HUB_CREDS_PSW} | docker login -u ${DOCKER_HUB_CREDS_USR} --password-stdin"
                sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker push ${IMAGE_NAME}:latest"
                sh "docker logout"
            }
        }
        
        stage('Deploy to Kubernetes') {
            environment {
                KUBECONFIG = credentials('kubeconfig')
            }
            steps {
                sh 'mkdir -p ~/.kube'
                sh 'cat $KUBECONFIG > ~/.kube/config'
                
                // Mise à jour des variables d'environnement dans les fichiers YAML
                sh """
                sed -i 's/\${DOCKER_HUB_USERNAME}/${DOCKER_HUB_USERNAME}/g' kubernetes/app/deployment.yaml
                sed -i 's/\${IMAGE_TAG}/${IMAGE_TAG}/g' kubernetes/app/deployment.yaml
                """
                
                // Application des fichiers Kubernetes
                sh '''
                kubectl apply -f kubernetes/secrets/db-credentials.yaml
                kubectl apply -f kubernetes/db/pv.yaml
                kubectl apply -f kubernetes/db/pvc.yaml
                kubectl apply -f kubernetes/db/deployment.yaml
                kubectl apply -f kubernetes/db/service.yaml
                kubectl apply -f kubernetes/app/configmap.yaml
                kubectl apply -f kubernetes/app/deployment.yaml
                kubectl apply -f kubernetes/app/service.yaml
                kubectl apply -f kubernetes/app/ingress.yaml
                '''
                
                // Attendre que les pods soient prêts
                sh '''
                kubectl rollout status deployment/todo-app
                kubectl rollout status deployment/todo-db
                '''
                
                // Afficher les ressources déployées
                sh '''
                echo "=== Deployed Resources ==="
                kubectl get pods,svc,ingress
                '''
            }
        }
    }
    
    post {
        always {
            // Nettoyage des images locales
            sh "docker rmi ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest || true"
            // Supprimer le fichier kubeconfig
            sh 'rm -f ~/.kube/config || true'
        }
        success {
            echo "===== Deployment completed successfully ====="
        }
        failure {
            echo "===== Deployment failed ====="
        }
    }
}
```

### Configuration des credentials Jenkins
Deux types de credentials sont nécessaires pour le pipeline:

1. **DockerHub Credentials**:
   - Type: Username with password
   - ID: docker-hub-credentials
   - Description: Identifiants DockerHub pour push des images

2. **Kubernetes Config**:
   - Type: Secret file
   - ID: kubeconfig
   - Description: Fichier kubeconfig pour accès au cluster

### Plugins Jenkins requis
- Docker Pipeline
- Kubernetes CLI Plugin
- Git Integration
- Pipeline
- Blue Ocean (optionnel, pour une meilleure UI)

### Mise en place du webhook GitHub
Pour automatiser le déclenchement du pipeline:

1. Dans Jenkins, activer "GitHub hook trigger for GITScm polling" dans la configuration du pipeline
2. Dans les paramètres GitHub du repository:
   - Aller dans Settings > Webhooks > Add webhook
   - Payload URL: http://192.168.56.10:8080/github-webhook/
   - Content type: application/json
   - Événements: Just the push event

## Surveillance et Maintenance

### Surveillance des déploiements
```bash
# Vérifier l'état des pods
kubectl get pods -l app=todo-app
kubectl get pods -l app=todo-db

# Vérifier les logs de l'application
kubectl logs -f deployment/todo-app

# Vérifier les logs de la base de données
kubectl logs -f deployment/todo-db
```

### Mise à l'échelle de l'application
```bash
# Augmenter le nombre de replicas
kubectl scale deployment todo-app --replicas=4

# Vérifier le nouveau nombre de replicas
kubectl get deployment todo-app
```

### Nettoyage complet
```bash
# Supprimer tous les ressources
kubectl delete -f kubernetes/app/
kubectl delete -f kubernetes/db/
kubectl delete -f kubernetes/secrets/
```

## Développement Local

### Configuration de l'environnement
```bash
# Cloner le dépôt
git clone https://github.com/[username]/todo-app.git
cd todo-app

# Installer les dépendances
npm install

# Lancer l'application en mode développement
./dev.sh
```

### Utilisation du script de développement
Le script `dev.sh` facilite le développement en gérant les conteneurs Docker :

```bash
# Rendre le script exécutable
chmod +x dev.sh

# Lancer l'application
./dev.sh
```

Le script :
- Vérifie l'installation de Docker et Docker Compose
- Crée un fichier `.env` à partir de `.env.example` si nécessaire
- Démarre les conteneurs en arrière-plan
- Affiche les logs en temps réel
- Arrête proprement les conteneurs lorsque vous appuyez sur Ctrl+C

### Accès à l'application
- Interface utilisateur: http://localhost:3000
- API REST: http://localhost:3000/api

## Infrastructure as Code

### Architecture de l'infrastructure
L'infrastructure est composée de deux machines virtuelles Ubuntu 22.04 LTS :
- **VM Jenkins** (192.168.56.10) : Serveur CI/CD
- **VM Kubernetes** (192.168.56.11) : Cluster Kubernetes à nœud unique

### Configuration des VMs avec Vagrant
Le fichier `terraform/vagrant/Vagrantfile` définit la configuration des deux VMs :
```ruby
Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/jammy64"
  
  # Jenkins VM
  config.vm.define "jenkins" do |jenkins|
    jenkins.vm.hostname = "jenkins"
    jenkins.vm.network "private_network", ip: "192.168.56.10"
    jenkins.vm.network "forwarded_port", guest: 8080, host: 8080
    jenkins.vm.provider "virtualbox" do |vb|
      vb.memory = "4096"
      vb.cpus = 2
    end
    jenkins.vm.provision "shell", path: "scripts/install_common.sh"
    jenkins.vm.provision "shell", path: "scripts/install_jenkins.sh"
  end

  # Kubernetes VM
  config.vm.define "kubernetes" do |k8s|
    k8s.vm.hostname = "kubernetes"
    k8s.vm.network "private_network", ip: "192.168.56.11"
    k8s.vm.network "forwarded_port", guest: 6443, host: 6443
    k8s.vm.provider "virtualbox" do |vb|
      vb.memory = "6144"
      vb.cpus = 2
    end
    k8s.vm.provision "shell", path: "scripts/install_common.sh"
    k8s.vm.provision "shell", path: "scripts/install_kubernetes.sh"
  end
end
```

### Scripts d'approvisionnement
Les scripts suivants configurent automatiquement les VMs :
- `install_common.sh` : Installe Docker, Git et NGINX
- `install_jenkins.sh` : Installe et configure Jenkins
- `install_kubernetes.sh` : Installe et configure Kubernetes avec PostgreSQL

### Accès aux services
- **Jenkins**: http://192.168.56.10:8080
- **Kubernetes API**: https://192.168.56.11:6443
- **Application TODO**: http://192.168.56.11:NodePort

## Structure de l'Application

### Architecture Backend
- **Express.js** : Routage et middleware
- **Sequelize** : ORM pour PostgreSQL
- **Winston** : Journalisation avancée

### API REST 
Endpoints disponibles sur `/api` :

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /tasks | Liste toutes les tâches |
| GET | /tasks/:id | Récupère une tâche spécifique |
| POST | /tasks | Crée une nouvelle tâche |
| PUT | /tasks/:id | Met à jour une tâche existante |
| DELETE | /tasks/:id | Supprime une tâche |

### Modèle de données
Le modèle `Task` comprend les champs suivants :
- `id` (UUID) : Identifiant unique de la tâche
- `title` (String) : Titre de la tâche (obligatoire)
- `description` (Text) : Description détaillée
- `status` (Enum) : État de la tâche ('todo', 'in_progress', 'done')
- `dueDate` (Date) : Date d'échéance
- `priority` (Enum) : Priorité ('low', 'medium', 'high')
- `createdAt`, `updatedAt` : Horodatages automatiques

### Configuration Docker
L'application utilise Docker Compose pour définir deux services:
1. **app** : Conteneur Node.js exécutant l'application
2. **db** : Conteneur PostgreSQL pour la base de données

Ports exposés:
- Application web: 3000
- PostgreSQL: 5433 (hôte) -> 5432 (conteneur)

## Tests

### Tests Unitaires et d'Intégration
```bash
# Exécuter tous les tests avec couverture
npm test

# Exécuter uniquement les tests unitaires
npx jest src/tests/unit

# Exécuter uniquement les tests d'intégration
npx jest src/tests/integration
```

### Workflow Git
Le projet utilise deux branches principales:
- `main`: Code de production, protégé par pull requests avec approbations obligatoires
- `dev`: Environnement de développement, tests CI requis avant fusion

## Bonnes pratiques DevOps implémentées

- **Infrastructure as Code**: Configuration complète des VM avec Vagrant
- **CI/CD**: Pipeline Jenkins automatisé de bout en bout
- **Containerisation**: Application encapsulée dans Docker
- **Orchestration**: Déploiement sur Kubernetes pour la scalabilité
- **Secrets Management**: Utilisation de Kubernetes Secrets
- **Haute disponibilité**: Réplication des pods d'application
- **Persistance des données**: Volumes persistants pour PostgreSQL
- **Tests automatisés**: Tests unitaires et d'intégration
- **Déploiement progressif**: Stratégie RollingUpdate
- **Surveillance**: Sondes de santé et état des pods

## Prochaines étapes
- Mise en place d'un monitoring avec Prometheus et Grafana
- Ajout d'une interface d'administration
- Optimisation de la sécurité des déploiements
- Configuration d'un CDN pour les actifs statiques
- Mise en place de backups automatisés pour PostgreSQL

---

*Projet développé dans le cadre du cours DevOps et Intégration Continue - Université Hassan 2*