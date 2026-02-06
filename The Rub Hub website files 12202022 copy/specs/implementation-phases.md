# The Rub Hub — Implementation Phases

## Phase 1: Foundation & Local Dev Environment (COMPLETE)

**Goal:** Bootable local development environment with empty app shell.

**Work:**
- [x] Initialize Next.js project with TypeScript, Tailwind CSS, ESLint
- [x] Set up `docker-compose.yml` with MySQL, WordPress, Nginx, Mailhog
- [x] Configure Prisma, define full schema, run initial migration
- [x] Set up NextAuth with credentials provider (email/password)
- [x] Create root layout with placeholder nav/footer
- [x] Write `Makefile` with common commands
- [x] Create `.env.example` with documented variables

**Verification:**
- [x] `docker compose up` boots all 5 services without errors
- [x] Homepage renders at `localhost:3000` (HTTP 200)
- [x] WP admin accessible at `localhost:8080/wp-admin` (HTTP 302 to install)
- [x] Database has all 13 tables via Prisma migration
- [x] Mailhog UI accessible at `localhost:8025` (HTTP 200)

**Notes:**
- Prisma 7 moved `DATABASE_URL` from `schema.prisma` to `prisma.config.ts` — schema adjusted accordingly
- Using NextAuth v5 (beta) with JWT session strategy
- Prisma client output configured to `src/generated/prisma`
- Added `db/init/01-create-databases.sql` to auto-create both `rubhub` and `rubhub_wp` databases on MySQL first boot

---

## Phase 2: Data Migration

**Goal:** Legacy data loaded into new schema, blog content in WordPress.

**Work:**
- Decompress and analyze legacy database dumps (`db/*.sql.gz`)
- Write SQL migration scripts to transform legacy data into Prisma schema:
  - `listing` -> `Provider`
  - `listing~contact` -> `Contact`
  - `listing~location` -> `Location`
  - `listing~menu` -> `Service`
  - `listing_subcategory` -> `Category`
  - `ailment_subcategory` -> `Specialty`
  - Junction tables -> `ProviderCategory`, `ProviderSpecialty`
  - `photo` -> `Photo`
  - `listing_event` -> `Event`
  - `coupon` -> `Coupon`
  - `comment` -> `Review`
  - `mc_account` -> `User` (rehash passwords to bcrypt)
- Write WP CLI script to import legacy blog posts and pages into headless WordPress
- Migrate provider photos/images to `public/images/`
- Package everything into `make seed` and `make import-wp-content` commands

**Verification:**
- `make seed` loads provider data, queryable via Prisma Studio
- `make import-wp-content` populates WordPress with blog posts
- Spot-check: provider records have correct contacts, locations, services
- Spot-check: blog posts render in WP admin

---

## Phase 3: Provider Directory

**Goal:** Fully functional directory search and provider profile pages.

**Work:**
- Build directory search page (`/directory`):
  - Search by keyword (provider name, bio)
  - Filter by category and specialty
  - Filter by location with radius (geocoding + distance calc)
  - Paginated results
- Build provider card component for search results
- Build individual provider profile page (`/directory/[slug]`):
  - Bio/description
  - Contact information (respecting `isPublic` flag)
  - Locations with embedded map (Google Maps or Mapbox)
  - Services/menu with pricing
  - Photos gallery
  - Events
  - Coupons
  - Reviews
- Build search API route (`/api/directory/search`) for client-side filtering
- Implement `lib/geo.ts` for geocoding and distance calculations

**Verification:**
- Can search providers by keyword, category, specialty
- Location-based search returns results within specified radius
- Provider profile pages display all sections with real data
- Map renders with correct pin locations

---

## Phase 4: Blog & Content Pages

**Goal:** Blog and static content pages rendering from WordPress.

**Work:**
- Build WordPress REST API client (`lib/wordpress.ts`):
  - Fetch posts (list, single by slug)
  - Fetch pages (single by slug)
  - Handle pagination
  - Type-safe response parsing
- Build blog listing page (`/blog`):
  - Post cards with title, excerpt, date, featured image
  - Pagination
- Build individual blog post page (`/blog/[slug]`):
  - Full post content rendered from WP HTML
  - Post metadata (date, author, categories)
- Build catch-all static page route (`/[slug]`):
  - Fetches WP page by slug
  - Renders content
  - 404 if page not found
- Configure ISR revalidation intervals

**Verification:**
- Blog listing shows posts from WordPress
- Individual blog posts render correctly with formatting/images
- Static pages (about, contact, etc.) load at their slugs
- Content changes in WP admin reflect on site after revalidation
- 404 page works for nonexistent slugs

---

## Phase 5: User Accounts & Listing Management

**Goal:** Users can register, log in, and manage their provider listings.

**Work:**
- Build auth pages:
  - Login (`/auth/login`)
  - Registration (`/auth/register`)
  - Forgot password (`/auth/forgot-password`) with email reset flow via Mailhog locally
- Build account dashboard (`/account`):
  - Welcome message, quick links
  - Account info summary
- Build profile edit page (`/account/profile`):
  - Update name, email, password
- Build listing management page (`/account/listing`):
  - Edit provider bio/name
  - Manage contacts (add/edit/remove)
  - Manage locations (add/edit/remove with geocoding)
  - Manage services (add/edit/remove)
  - Manage photos (upload/reorder/remove)
  - Manage events and coupons
- Protect `/account/*` routes with NextAuth middleware
- Form validation (server-side and client-side)

**Verification:**
- Can register a new account
- Can log in and log out
- Can reset password via email (check Mailhog)
- Can edit all sections of a provider listing
- Changes to listing immediately reflected on `/directory/[slug]`
- Unauthenticated users redirected from `/account/*` to login

---

## Phase 6: Polish & Production Prep

**Goal:** Production-ready, responsive, optimized application.

**Work:**
- Responsive design pass across all pages (mobile, tablet, desktop)
- SEO:
  - Dynamic meta tags and Open Graph per page
  - Sitemap generation (`/sitemap.xml`)
  - JSON-LD structured data (LocalBusiness schema for providers)
  - Canonical URLs
- Error handling:
  - Custom 404 page
  - Custom 500 page
  - Error boundaries for client components
- Image optimization:
  - Migrate to Next.js `<Image>` component throughout
  - Configure remote image domains
- Production Docker setup:
  - Multi-stage `Dockerfile` for Next.js (build + runtime)
  - `docker-compose.prod.yml` with production MySQL, WP, Nginx configs
  - Health checks on all containers
- Environment variable documentation
- Basic logging/monitoring setup

**Verification:**
- Lighthouse scores: Performance > 80, Accessibility > 90, SEO > 90
- All pages work on mobile (test key breakpoints)
- Production containers build and run via `docker compose -f docker-compose.prod.yml up`
- No console errors, no broken images, no dead links
- 404 and 500 pages render correctly
