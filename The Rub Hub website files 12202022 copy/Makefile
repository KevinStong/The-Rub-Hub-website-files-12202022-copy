.PHONY: up down build logs restart mysql load-legacy seed reset-db import-wp-content prisma-studio prisma-migrate prisma-generate dev install

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

load-legacy:
	bash db/load-legacy.sh

seed: load-legacy
	cd app && npx tsx prisma/seed.ts

reset-db:
	docker compose exec -T mysql mysql -u root -prubhub_dev_2024 -e "DROP DATABASE IF EXISTS rubhub; CREATE DATABASE rubhub; DROP DATABASE IF EXISTS rubhub_legacy; CREATE DATABASE rubhub_legacy;"
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
	bash db/import-wp-content.sh

# ─── Next.js (local dev without Docker) ─────────────────────

dev:
	cd app && npm run dev

install:
	cd app && npm install
