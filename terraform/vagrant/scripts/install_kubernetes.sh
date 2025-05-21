#!/bin/bash
# Script d'installation de Kubernetes pour Ubuntu 22.04 - Méthode actualisée

set -e

echo "=== Installation de Kubernetes ==="

# Désactivation du swap
swapoff -a
sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

# Configuration des modules du noyau
cat > /etc/modules-load.d/containerd.conf << EOF
overlay
br_netfilter
EOF

modprobe overlay
modprobe br_netfilter

# Configuration sysctl
cat > /etc/sysctl.d/99-kubernetes.conf << EOF
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

sysctl --system

# Configuration de containerd
mkdir -p /etc/containerd
containerd config default | tee /etc/containerd/config.toml > /dev/null
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/g' /etc/containerd/config.toml
systemctl restart containerd
systemctl enable containerd

# Nettoyage des configurations précédentes
rm -f /etc/apt/sources.list.d/kubernetes.list
rm -f /etc/apt/keyrings/kubernetes-*.gpg

# Installation des prérequis
apt-get update
apt-get install -y apt-transport-https ca-certificates curl gnupg

# Configuration du dépôt Kubernetes (méthode compatible avec Ubuntu 22.04)
# Création du dossier pour les clés
mkdir -p /etc/apt/keyrings

# Téléchargement et installation de la clé GPG
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.29/deb/Release.key | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
chmod 644 /etc/apt/keyrings/kubernetes-apt-keyring.gpg

# Ajout du dépôt
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.29/deb/ /" | tee /etc/apt/sources.list.d/kubernetes.list

# Installation de Kubernetes
apt-get update
apt-get install -y kubelet kubeadm kubectl
apt-mark hold kubelet kubeadm kubectl

# Vérification de l'installation
echo "=== Vérification de l'installation ==="
kubectl version --client
kubeadm version

# Initialisation du cluster
echo "=== Initialisation du cluster Kubernetes ==="
LOCAL_IP=$(ip -f inet addr show enp0s8 | grep -Po 'inet \K[\d.]+')
echo "Initialisation avec IP: $LOCAL_IP"

# Initialisation avec kubeadm
kubeadm init --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=$LOCAL_IP

# Configuration pour l'utilisateur vagrant
mkdir -p /home/vagrant/.kube
cp -i /etc/kubernetes/admin.conf /home/vagrant/.kube/config
chown -R vagrant:vagrant /home/vagrant/.kube
chmod 600 /home/vagrant/.kube/config

# Configuration pour l'utilisateur root
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
chmod 600 $HOME/.kube/config

# Installation de flannel pour le réseau
echo "=== Installation du réseau Flannel ==="
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml

# Permettre l'ordonnancement des pods sur le nœud maître
kubectl taint nodes --all node-role.kubernetes.io/control-plane-

# Pause pour permettre au cluster de s'initialiser
sleep 30

# Installation de Helm
echo "=== Installation de Helm ==="
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Ajout du repo Bitnami
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Création de l'espace de noms pour la base de données
kubectl create namespace database

# Déploiement de PostgreSQL
echo "=== Déploiement de PostgreSQL ==="
helm install postgresql bitnami/postgresql \
  --namespace database \
  --set global.postgresql.auth.postgresPassword=postgres \
  --set global.postgresql.auth.username=postgres \
  --set global.postgresql.auth.password=postgres \
  --set global.postgresql.auth.database=todo_app \
  --set persistence.size=8Gi

# Installation de l'Ingress Controller NGINX
echo "=== Installation du contrôleur Ingress NGINX ==="
helm install nginx-ingress bitnami/nginx-ingress-controller \
  --set service.type=NodePort

# Script pour vérifier l'état du cluster
cat > /home/vagrant/check_cluster.sh << 'EOF'
#!/bin/bash
echo "Nœuds Kubernetes :"
kubectl get nodes

echo -e "\nPods par espace de noms :"
kubectl get pods --all-namespaces

echo -e "\nServices :"
kubectl get services --all-namespaces

echo -e "\nInformations sur PostgreSQL :"
kubectl get pods -n database
kubectl get pvc -n database
kubectl get services -n database
EOF

chmod +x /home/vagrant/check_cluster.sh
chown vagrant:vagrant /home/vagrant/check_cluster.sh

# Configuration NGINX pour accéder à l'API Kubernetes
cat > /etc/nginx/sites-available/kubernetes << 'EOF'
server {
    listen 80;
    server_name kubernetes;

    location / {
        proxy_pass https://localhost:6443;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_ssl_verify off;
    }
}
EOF

# Activer la configuration NGINX
ln -sf /etc/nginx/sites-available/kubernetes /etc/nginx/sites-enabled/
systemctl reload nginx

echo "=== Kubernetes installé et configuré ==="
echo "Cluster Kubernetes accessible via: https://192.168.56.11:6443"
echo "Utilisez la commande ./check_cluster.sh pour vérifier l'état du cluster"