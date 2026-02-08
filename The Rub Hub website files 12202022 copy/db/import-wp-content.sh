#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WP_DUMP="$SCRIPT_DIR/rubhubwp_nighty_dump.sql"

# Load password from .env file
if [ -f "$PROJECT_DIR/.env" ]; then
  MYSQL_ROOT_PASSWORD=$(grep MYSQL_ROOT_PASSWORD "$PROJECT_DIR/.env" | cut -d '=' -f2)
fi
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-rubhub_dev_2024}"

if [ ! -f "$WP_DUMP" ]; then
  echo "Error: WP dump not found at $WP_DUMP"
  exit 1
fi

echo "Clearing rubhub_wp database..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T mysql \
  mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e \
  "DROP DATABASE IF EXISTS rubhub_wp; CREATE DATABASE rubhub_wp;"

echo "Loading WP dump (replacing wpRub_ prefix with wp_)..."
sed 's/wpRub_/wp_/g' "$WP_DUMP" | \
  docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T mysql \
  mysql -u root -p"$MYSQL_ROOT_PASSWORD" rubhub_wp

echo "Updating site URLs to localhost:8080..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T mysql \
  mysql -u root -p"$MYSQL_ROOT_PASSWORD" rubhub_wp -e "
    UPDATE wp_options SET option_value = 'http://localhost:8080' WHERE option_name IN ('siteurl', 'home');
  "

echo "WordPress content imported successfully."
