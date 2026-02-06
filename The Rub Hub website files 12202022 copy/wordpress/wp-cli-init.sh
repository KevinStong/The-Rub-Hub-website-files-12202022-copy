#!/bin/bash
# First-run setup for headless WordPress.
# Run manually: docker compose exec wordpress wp-cli-init.sh

set -e

# Wait for WordPress to be ready
until wp core is-installed --allow-root 2>/dev/null; do
  echo "Waiting for WordPress installation..."
  sleep 5
  # Install if not yet installed
  wp core install \
    --url="http://localhost:8080" \
    --title="The Rub Hub" \
    --admin_user=admin \
    --admin_password=admin \
    --admin_email=admin@therubhub.local \
    --skip-email \
    --allow-root 2>/dev/null || true
done

echo "WordPress is installed."

# Enable REST API (should be on by default, but ensure permalinks are set)
wp rewrite structure '/%postname%/' --allow-root

echo "WordPress headless setup complete."
echo "Admin: http://localhost:8080/wp-admin (admin / admin)"
