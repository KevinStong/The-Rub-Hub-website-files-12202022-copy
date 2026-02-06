# The Rub Hub — Modernization Design

## Overview

Selective rebuild of The Rub Hub from an archived legacy PHP/MightySite CMS codebase into a modern Next.js application. Retaining: provider directory, user accounts, blog/content pages. Dropping: e-commerce (shopping cart, checkout, payments).

## Technology Stack

- **Framework:** Next.js (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **ORM:** Prisma (MySQL)
- **Auth:** NextAuth.js (credentials provider, email/password)
- **CMS:** WordPress (headless, REST API only — for blog and content pages)
- **Local Dev:** Docker Compose
- **Deployment:** Dockerized production containers

## Architecture

```
+---------------------------------------------+
|              Next.js App (App Router)        |
|                                              |
|  +----------+  +-----------+  +-----------+ |
|  | Directory |  |   Auth    |  |   Blog    | |
|  |  Pages    |  | (NextAuth |  |  Pages    | |
|  |           |  |   .js)    |  |           | |
|  +----+------+  +-----+-----+  +-----+-----+ |
|       |               |              |       |
|  +----+---------------+------+  +----+-----+ |
|  |   Prisma ORM (MySQL)     |  | WP REST  | |
|  |   - Providers             |  |  API     | |
|  |   - Users                 |  |          | |
|  |   - Locations             |  |          | |
|  +---------------------------+  +----------+ |
+---------------------------------------------+
               |                       |
        +------+------+        +-------+------+
        |   MySQL     |        |  WordPress   |
        |  (app data) |        |  (headless)  |
        +-------------+        +--------------+
```

**Two data sources:**

- **MySQL via Prisma** — all application data: provider directory listings, user accounts, locations, categories. Clean modern schema designed from scratch.
- **WordPress (headless)** — blog posts and static content pages only. Accessed via WP REST API. No WP themes or frontend rendering.

## Local Development Environment

```
docker-compose.yml
  next-app        Next.js dev server, hot reload via volume mount
  mysql           MySQL 8, serves both app DB and WordPress DB
  wordpress       WordPress + PHP-FPM, headless (wp-admin only)
  nginx           Reverse proxy: /wp-admin + /wp-json to WP, else to Next.js
  mailhog         Catches outbound email locally
```

- `docker compose up` starts everything.
- `.env.local` for Next.js, `.env` for Docker Compose, `.env.example` in git.
- `Makefile` wraps common commands: `make seed`, `make reset-db`, `make import-wp-content`.
- WP CLI script runs on first startup to import legacy blog content.

## Data Model (Prisma Schema)

### Core Directory Models

```prisma
model Provider {
  id          Int       @id @default(autoincrement())
  slug        String    @unique
  name        String
  bio         String?   @db.Text
  status      String    @default("active")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  contacts    Contact[]
  locations   Location[]
  services    Service[]
  photos      Photo[]
  events      Event[]
  coupons     Coupon[]
  categories  ProviderCategory[]
  specialties ProviderSpecialty[]
  reviews     Review[]
  user        User?     @relation(fields: [userId], references: [id])
  userId      Int?      @unique
}

model Contact {
  id          Int      @id @default(autoincrement())
  providerId  Int
  firstName   String
  lastName    String
  email       String?
  phone       String?
  isPublic    Boolean  @default(true)
  provider    Provider @relation(fields: [providerId], references: [id])
}

model Location {
  id          Int      @id @default(autoincrement())
  providerId  Int
  name        String?
  address1    String
  address2    String?
  city        String
  state       String
  zip         String
  country     String   @default("US")
  lat         Float?
  lng         Float?
  hidden      Boolean  @default(false)
  provider    Provider @relation(fields: [providerId], references: [id])
}

model Service {
  id          Int      @id @default(autoincrement())
  providerId  Int
  name        String
  type        String?
  price       Decimal? @db.Decimal(10, 2)
  description String?  @db.Text
  isSpecial   Boolean  @default(false)
  sortOrder   Int      @default(0)
  provider    Provider @relation(fields: [providerId], references: [id])
}

model Photo {
  id          Int      @id @default(autoincrement())
  providerId  Int
  name        String?
  caption     String?
  url         String
  thumbUrl    String?
  sortOrder   Int      @default(0)
  hidden      Boolean  @default(false)
  provider    Provider @relation(fields: [providerId], references: [id])
}

model Event {
  id          Int       @id @default(autoincrement())
  providerId  Int
  name        String
  description String?   @db.Text
  startDate   DateTime
  endDate     DateTime?
  city        String?
  state       String?
  country     String?   @default("US")
  zip         String?
  hidden      Boolean   @default(false)
  provider    Provider  @relation(fields: [providerId], references: [id])
}

model Coupon {
  id              Int      @id @default(autoincrement())
  providerId      Int
  name            String
  description     String?  @db.Text
  smallPrint      String?  @db.Text
  promoCode       String?
  expirationDate  DateTime?
  firstTimeOnly   Boolean  @default(false)
  appointmentOnly Boolean  @default(false)
  hidden          Boolean  @default(false)
  sortOrder       Int      @default(0)
  provider        Provider @relation(fields: [providerId], references: [id])
}

model Review {
  id          Int      @id @default(autoincrement())
  providerId  Int
  status      String   @default("pending")
  content     String   @db.Text
  createdAt   DateTime @default(now())
  provider    Provider @relation(fields: [providerId], references: [id])
}
```

### Auth & Accounts

```prisma
model User {
  id            Int       @id @default(autoincrement())
  email         String    @unique
  passwordHash  String
  firstName     String
  lastName      String
  createdAt     DateTime  @default(now())
  lastLoginAt   DateTime?
  provider      Provider?
}
```

### Reference Tables

```prisma
model Category {
  id        Int                @id @default(autoincrement())
  name      String             @unique
  slug      String             @unique
  providers ProviderCategory[]
}

model Specialty {
  id        Int                 @id @default(autoincrement())
  name      String              @unique
  slug      String              @unique
  providers ProviderSpecialty[]
}

model ProviderCategory {
  id         Int      @id @default(autoincrement())
  providerId Int
  categoryId Int
  provider   Provider @relation(fields: [providerId], references: [id])
  category   Category @relation(fields: [categoryId], references: [id])
  @@unique([providerId, categoryId])
}

model ProviderSpecialty {
  id          Int       @id @default(autoincrement())
  providerId  Int
  specialtyId Int
  provider    Provider  @relation(fields: [providerId], references: [id])
  specialty   Specialty @relation(fields: [specialtyId], references: [id])
  @@unique([providerId, specialtyId])
}
```

### Key Changes from Legacy

- Tilde table names (`listing~contact`) replaced with standard Prisma relations
- `hidden` Yes/No strings become proper booleans
- SHA1/AES passwords become bcrypt via NextAuth
- State/country IDs denormalized to strings (no lookup tables needed)
- `_private` flag pairs consolidated into single `isPublic` boolean
- `sequence` fields renamed to `sortOrder`
- Facebook auth removed (can be re-added later via NextAuth provider)

## App Structure & Routing

```
the-rub-hub/
  docker-compose.yml
  Makefile
  .env.example
  wordpress/
    Dockerfile
    wp-cli-init.sh
  nginx/
    nginx.conf
  db/
    seed.sql
    legacy-dumps/
  app/                          # Next.js project root
    package.json
    tsconfig.json
    tailwind.config.ts
    next.config.ts
    prisma/
      schema.prisma
      migrations/
    src/
      app/
        layout.tsx                       # root layout (nav, footer)
        page.tsx                         # homepage
        directory/
          page.tsx                       # search/browse providers
          [slug]/
            page.tsx                     # individual provider profile
        blog/
          page.tsx                       # blog listing (from WP API)
          [slug]/
            page.tsx                     # individual blog post
        auth/
          login/page.tsx
          register/page.tsx
          forgot-password/page.tsx
        account/
          page.tsx                       # dashboard
          profile/page.tsx               # edit account info
          listing/
            page.tsx                     # manage your provider listing
        [slug]/
          page.tsx                       # static CMS pages (about, contact)
        api/
          auth/[...nextauth]/route.ts
          directory/
            search/route.ts
      lib/
        prisma.ts                        # Prisma client singleton
        auth.ts                          # NextAuth config
        wordpress.ts                     # WP REST API client
        geo.ts                           # geocoding/distance helpers
      components/
        ui/                              # reusable primitives
        layout/                          # header, footer, nav
        directory/                       # search form, provider card, map
        blog/                            # post card, post content
      types/
        index.ts
    public/
      images/
```

### Routing Strategy

| URL | Source | Rendering |
|-----|--------|-----------|
| `/` | Prisma + WP API | Static (ISR) |
| `/directory` | Prisma (search query) | Dynamic SSR |
| `/directory/[slug]` | Prisma (provider record) | ISR, revalidate on edit |
| `/blog` | WP REST API | ISR, revalidate hourly |
| `/blog/[slug]` | WP REST API | ISR |
| `/auth/*` | NextAuth | Dynamic |
| `/account/*` | Prisma (authenticated) | Dynamic, protected |
| `/about`, `/contact`, etc. | WP REST API (pages) | ISR |
