#!/bin/bash
set -euo pipefail

APP_DIR="/opt/shelfbidder"
REPO_URL="${1:-}"

echo "Starting ShelfBidder EC2 host bootstrap..."

if grep -q "Amazon Linux" /etc/os-release; then
    sudo dnf update -y
    sudo dnf install -y docker git curl jq awscli
    if ! sudo dnf install -y docker-compose-plugin; then
        DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
        mkdir -p "$DOCKER_CONFIG/cli-plugins"
        curl -SL https://github.com/docker/compose/releases/download/v2.39.0/docker-compose-linux-x86_64 \
            -o "$DOCKER_CONFIG/cli-plugins/docker-compose"
        chmod +x "$DOCKER_CONFIG/cli-plugins/docker-compose"
    fi
elif grep -q "Ubuntu" /etc/os-release; then
    sudo apt update -y
    sudo apt install -y docker.io docker-compose-v2 git curl jq awscli
else
    echo "Unsupported Linux distribution. Install Docker, Docker Compose, git, jq, curl, and awscli manually."
    exit 1
fi

sudo systemctl enable --now docker
sudo usermod -aG docker "$USER" || true
sudo usermod -aG docker ssm-user || true

sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER:$USER" "$APP_DIR"

if [ -n "$REPO_URL" ] && [ ! -d "$APP_DIR/.git" ]; then
    git clone "$REPO_URL" "$APP_DIR"
fi

if [ ! -d "$APP_DIR/.git" ]; then
    echo "Repository not present in $APP_DIR."
    echo "Clone it first, for example:"
    echo "  git clone <repo-url> $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

if [ ! -f ".env.ec2" ] && [ -f ".env.ec2.example" ]; then
    cp .env.ec2.example .env.ec2
fi

echo ""
echo "EC2 bootstrap complete."
echo "Next steps:"
echo "1. cd $APP_DIR"
echo "2. Edit .env.ec2 with domain, secrets, bucket names, and app settings"
echo "3. Run infrastructure/scripts/first-deploy-ec2.sh"
echo "4. Add host cron entries for certificate renewal and PostgreSQL backups"
