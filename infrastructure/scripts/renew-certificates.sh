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

APP_ENV_FILE="$ENV_FILE" docker compose \
    --env-file "$ENV_FILE" \
    -f "$COMPOSE_FILE" \
    --profile certbot \
    run --rm certbot renew --webroot --webroot-path /var/www/certbot --quiet

APP_ENV_FILE="$ENV_FILE" docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec nginx nginx -s reload

echo "Certificate renewal run completed."
