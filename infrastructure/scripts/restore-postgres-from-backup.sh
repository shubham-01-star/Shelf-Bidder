#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env.ec2}"
COMPOSE_FILE="$REPO_ROOT/docker-compose.prod.yml"
BACKUP_SOURCE="${1:-}"

if [ -z "$BACKUP_SOURCE" ]; then
    echo "Usage: $0 <local-backup.sql.gz|s3://bucket/key.sql.gz>"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "Missing $ENV_FILE"
    exit 1
fi

set -a
. "$ENV_FILE"
set +a

TEMP_FILE=""
if [[ "$BACKUP_SOURCE" == s3://* ]]; then
    TEMP_FILE="$(mktemp /tmp/shelfbidder-restore-XXXXXX.sql.gz)"
    aws s3 cp "$BACKUP_SOURCE" "$TEMP_FILE"
    BACKUP_FILE="$TEMP_FILE"
else
    BACKUP_FILE="$BACKUP_SOURCE"
fi

gunzip -c "$BACKUP_FILE" | APP_ENV_FILE="$ENV_FILE" docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
    psql -U "$DB_USER" -d "$DB_NAME"

if [ -n "$TEMP_FILE" ] && [ -f "$TEMP_FILE" ]; then
    rm -f "$TEMP_FILE"
fi

echo "Restore completed into database $DB_NAME"
