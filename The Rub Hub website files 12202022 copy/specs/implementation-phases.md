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

## Phase 2: Data Migration (COMPLETE)

**Goal:** Legacy data loaded into new schema, blog content in WordPress.

**Work:**
- [x] Decompress and analyze legacy database dumps (`db/*.sql.gz`)
- [x] Write TypeScript migration script (`app/prisma/seed.ts`) using Prisma + mysql2:
  - [x] `listing` -> `Provider` + `User` (active/visible only)
  - [x] `listing~contact` -> `Contact` (privacy flags → isPublic)
  - [x] `listing~location` -> `Location` (state_id/country_id denormalized)
  - [x] `listing~menu` -> `Service` (price varchar → Decimal)
  - [x] `listing_subcategory` -> `Category` (slug generated)
  - [x] `ailment_subcategory` -> `Specialty` (slug generated)
  - [x] Junction tables -> `ProviderCategory`, `ProviderSpecialty`
  - [x] `photo` -> `Photo`
  - [x] `listing_event` -> `Event`
  - [x] `coupon` -> `Coupon`
  - [x] `comment` -> `Review`
  - [x] `listing` credentials -> `User` (plain text for dev)
- [x] Write WP import script (`db/import-wp-content.sh`) — prefix rename + URL update
- [ ] Migrate provider photos/images to `public/images/` (deferred to Phase 3)
- [x] Package into `make seed` (loads legacy dump + runs seed.ts) and `make import-wp-content`

**Notes:**
- Migration uses TypeScript/Prisma instead of raw SQL for type safety and easier debugging
- Legacy passwords stored as-is (plain text) since this is dev data only
- Photos keep legacy `filebin/` paths in DB; actual file serving deferred to Phase 3
- Only active, visible records migrated (status='active' AND hidden='No')
- Shell scripts: `db/load-legacy.sh`, `db/import-wp-content.sh`
- Prisma 7 requires `@prisma/adapter-mariadb` driver adapter with explicit connection params (not URL)
- Legacy `comment` table uses `tableid` + `tablename_use` as polymorphic FK (not `listing_id`)
- 2 services skipped due to name exceeding column length (2195/2197 migrated)

**Migration Results:**
| Entity | Count |
|--------|-------|
| Categories | 180 |
| Specialties | 30 |
| Providers | 5,164 |
| Provider-Categories | 7,175 |
| Provider-Specialties | 2,367 |
| Contacts | 5,057 |
| Locations | 2,568 |
| Services | 2,195 |
| Photos | 1,650 |
| Events | 280 |
| Coupons | 25 |
| Reviews | 350 |

**Verification:**
- [x] `make seed` loads provider data, queryable via Prisma Studio
- [x] `make import-wp-content` populates WordPress with blog posts
- [x] Spot-check: provider records have correct contacts, locations, services
- [x] Spot-check: blog posts render in WP admin

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
