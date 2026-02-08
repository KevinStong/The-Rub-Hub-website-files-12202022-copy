#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DUMP_FILE="$SCRIPT_DIR/rubhub_nighty_dump.sql"

# Load password from .env file
if [ -f "$PROJECT_DIR/.env" ]; then
  MYSQL_ROOT_PASSWORD=$(grep MYSQL_ROOT_PASSWORD "$PROJECT_DIR/.env" | cut -d '=' -f2)
fi
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-rubhub_dev_2024}"

if [ ! -f "$DUMP_FILE" ]; then
  echo "Error: Legacy dump not found at $DUMP_FILE"
  exit 1
fi

echo "Creating rubhub_legacy database..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T mysql \
  mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e \
  "DROP DATABASE IF EXISTS rubhub_legacy; CREATE DATABASE rubhub_legacy;"

echo "Loading legacy dump into rubhub_legacy (this may take a few minutes)..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T mysql \
  mysql -u root -p"$MYSQL_ROOT_PASSWORD" rubhub_legacy < "$DUMP_FILE"

echo "Legacy dump loaded successfully."
