#!/bin/bash
# Script d'installation de Jenkins pour Ubuntu 22.04

set -e

echo "=== Installation de Jenkins ==="

# Installation de Java
apt-get install -y openjdk-17-jdk

# Installation de Jenkins avec le nouveau format de clé pour Ubuntu 22.04
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null
apt-get update
apt-get install -y jenkins

# Configuration de Jenkins
usermod -aG docker jenkins
systemctl enable jenkins
systemctl start jenkins

# Installation de kubectl
echo "=== Installation de kubectl ==="
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
mv kubectl /usr/local/bin/

# Sauvegarde du mot de passe initial de Jenkins
echo "=== Sauvegarde du mot de passe Jenkins ==="
echo "Mot de passe initial Jenkins :" > /home/vagrant/jenkins_password.txt
cat /var/lib/jenkins/secrets/initialAdminPassword >> /home/vagrant/jenkins_password.txt
chown vagrant:vagrant /home/vagrant/jenkins_password.txt
chmod 600 /home/vagrant/jenkins_password.txt

# Configuration d'un proxy NGINX pour Jenkins
echo "=== Configuration du proxy NGINX pour Jenkins ==="
cat > /etc/nginx/sites-available/jenkins << 'EOF'
server {
    listen 80;
    server_name jenkins;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Suppression de la configuration par défaut et activation du site Jenkins
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/jenkins /etc/nginx/sites-enabled/
systemctl reload nginx

echo "=== Jenkins installé et configuré ==="
echo "Accès à Jenkins: http://192.168.56.10:8080"