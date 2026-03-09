#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env.ec2}"
COMPOSE_FILE="$REPO_ROOT/docker-compose.prod.yml"
BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/backups}"

if [ ! -f "$ENV_FILE" ]; then
    echo "Missing $ENV_FILE"
    exit 1
fi

set -a
. "$ENV_FILE"
set +a

if [ -z "${S3_BACKUP_URI:-}" ]; then
    echo "S3_BACKUP_URI must be set in $ENV_FILE"
    exit 1
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILENAME="postgres-${DB_NAME}-${TIMESTAMP}.sql.gz"
ARCHIVE_PATH="$BACKUP_DIR/$FILENAME"

APP_ENV_FILE="$ENV_FILE" docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
    pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$ARCHIVE_PATH"

aws s3 cp "$ARCHIVE_PATH" "${S3_BACKUP_URI%/}/$FILENAME"

echo "Backup written to $ARCHIVE_PATH"
echo "Backup uploaded to ${S3_BACKUP_URI%/}/$FILENAME"
