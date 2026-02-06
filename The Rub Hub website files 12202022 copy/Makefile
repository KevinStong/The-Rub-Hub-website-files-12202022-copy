.PHONY: up down build logs restart mysql wp-init seed reset-db import-wp-content prisma-studio prisma-migrate

# ─── Docker ──────────────────────────────────────────────────

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build --no-cache

logs:
	docker compose logs -f

restart:
	docker compose restart

# ─── Database ────────────────────────────────────────────────

mysql:
	docker compose exec mysql mysql -u root -p rubhub

seed:
	docker compose exec mysql mysql -u root -prubhub_dev_2024 rubhub < db/seed.sql

reset-db:
	docker compose exec mysql mysql -u root -prubhub_dev_2024 -e "DROP DATABASE IF EXISTS rubhub; CREATE DATABASE rubhub;"
	cd app && npx prisma migrate deploy

# ─── Prisma ──────────────────────────────────────────────────

prisma-studio:
	cd app && npx prisma studio

prisma-migrate:
	cd app && npx prisma migrate dev

prisma-generate:
	cd app && npx prisma generate

# ─── WordPress ───────────────────────────────────────────────

wp-init:
	docker compose exec wordpress wp-cli-init.sh

import-wp-content:
	@echo "TODO: import legacy blog content via WP CLI (Phase 2)"

# ─── Next.js (local dev without Docker) ─────────────────────

dev:
	cd app && npm run dev

install:
	cd app && npm install
