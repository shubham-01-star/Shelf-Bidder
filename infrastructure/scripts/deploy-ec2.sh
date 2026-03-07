#!/bin/bash
set -e

echo "Starting ShelfBidder EC2 Deployment Setup..."

# 1. System Updates and Docker Installation
echo "Updating packages..."
sudo dnf update -y || sudo apt update -y

echo "Installing Docker..."
# For Amazon Linux 2023
if grep -q "Amazon Linux" /etc/os-release; then
    sudo dnf install -y docker git
    # Install Docker Compose plugin
    DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
    mkdir -p $DOCKER_CONFIG/cli-plugins
    curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
    chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
# For Ubuntu
elif grep -q "Ubuntu" /etc/os-release; then
    sudo apt install -y docker.io docker-compose-v2 git
fi

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add ssm-user (or current user) to docker group
sudo usermod -aG docker $USER || true
sudo usermod -aG docker ssm-user || true

echo "Docker installation complete. You may need to logout and log back in, or run 'newgrp docker'."

# 2. Directory Setup
echo "Setting up application directory..."
sudo mkdir -p /var/www/shelfbidder
sudo chown -R $USER:$USER /var/www/shelfbidder

# 3. Pull Repository
echo "Please ensure you clone your repository into /var/www/shelfbidder"
echo "Example: git clone https://github.com/Startuplab2025/Shelf-Bidder-2025 /var/www/shelfbidder"

# 4. Generate .env.local
echo "Creating placeholder .env.local..."
cat << EOF > /var/www/shelfbidder/.env.local
# === Database ===
DB_HOST=postgres
DB_PORT=5432
DB_NAME=shelfbidder
DB_USER=postgres
DB_PASSWORD=postgres_dev_password

# === AWS Configuration (Set these from CDK outputs via System Manager) ===
AWS_REGION=ap-south-1
NEXT_PUBLIC_AWS_REGION=ap-south-1
NEXT_PUBLIC_USER_POOL_ID=YOUR_USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID=YOUR_CLIENT_ID
NEXT_PUBLIC_PHOTO_BUCKET_NAME=YOUR_PHOTO_BUCKET

# Since we're using IAM Roles on EC2, we don't need hardcoded access keys here,
# unless you must pass them to the Docker container if it can't inherit the EC2 role automatically.
EOF

echo "Deployment script execution complete!"
echo "Next steps:"
echo "1. Cd to /var/www/shelfbidder"
echo "2. Edit .env.local with actual values"
echo "3. Run 'docker compose up -d' or 'docker compose up -d postgres nginx app'"
echo "4. Once running, generate SSL via certbot container if needed."
