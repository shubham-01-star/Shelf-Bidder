#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env.ec2}"
COMPOSE_FILE="$REPO_ROOT/docker-compose.prod.yml"

if [ ! -f "$ENV_FILE" ]; then
    echo "Missing $ENV_FILE"
    exit 1
fi

set -a
. "$ENV_FILE"
set +a

if [ -z "${DOMAIN_NAME:-}" ] || [ -z "${LETSENCRYPT_EMAIL:-}" ]; then
    echo "DOMAIN_NAME and LETSENCRYPT_EMAIL must be set in $ENV_FILE"
    exit 1
fi

docker_compose() {
    APP_ENV_FILE="$ENV_FILE" docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

echo "Starting initial HTTP deployment for certificate issuance..."
NGINX_TEMPLATE_PATH=./infrastructure/nginx/default.http.conf.template \
    docker_compose up -d --build postgres app nginx

echo "Waiting for app readiness..."
for attempt in $(seq 1 30); do
    if curl -fsS http://127.0.0.1/api/health >/dev/null 2>&1; then
        break
    fi
    sleep 5
    if [ "$attempt" -eq 30 ]; then
        echo "App did not become healthy in time."
        exit 1
    fi
done

echo "Requesting Let's Encrypt certificate for $DOMAIN_NAME..."
APP_ENV_FILE="$ENV_FILE" docker compose \
    --env-file "$ENV_FILE" \
    -f "$COMPOSE_FILE" \
    --profile certbot \
    run --rm certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --email "$LETSENCRYPT_EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN_NAME"

echo "Switching Nginx to HTTPS configuration..."
docker_compose up -d nginx

echo "Initial deployment complete."
echo "Install these host cron jobs next:"
echo "0 3 * * * cd $REPO_ROOT && ./infrastructure/scripts/renew-certificates.sh"
echo "30 3 * * * cd $REPO_ROOT && ./infrastructure/scripts/backup-postgres-to-s3.sh"
