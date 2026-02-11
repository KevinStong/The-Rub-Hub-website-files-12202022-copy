# Phase 3: Provider Directory — Design

## Goal
Fully functional directory search and provider profile pages with keyword, category, specialty, and location filtering.

## Architecture
Server Components with URL-based search state. Two routes: `/directory` (search/browse) and `/directory/[slug]` (profile). The search form is the only client component — everything else is server-rendered for SEO and simplicity.

## Decisions
- **No geo/radius search** — defer until lat/lng data is geocoded. Filter by state/city text instead.
- **Server Components + URL params** — search state in query params, server-side Prisma queries, shareable URLs.
- **Full profile page** — all sections (bio, contacts, locations, services, photos, events, coupons, reviews) on one scrollable page. Empty sections hidden.

## Routes
- `/directory?q=&category=&specialty=&state=&city=&page=1` — search page, 20 results/page
- `/directory/[slug]` — provider profile with all relations

## File Structure
```
app/src/app/directory/
  page.tsx                  — search page
  [slug]/page.tsx           — provider profile
app/src/components/
  directory/
    search-form.tsx         — client component, keyword + filter dropdowns
    provider-card.tsx       — card for search results
    pagination.tsx          — page navigation
  provider/
    contact-section.tsx
    location-section.tsx
    services-section.tsx
    photos-section.tsx
    events-section.tsx
    coupons-section.tsx
    reviews-section.tsx
```

## Search
- Keyword: SQL LIKE on provider name and bio
- Category/Specialty: relation filter via slug
- State/City: relation filter on locations
- Pagination: offset-based, 20 per page

## Provider Card
Name, primary category, city/state, truncated bio (2 lines), link to profile.

## Profile Sections
1. Header — name, category tags
2. Bio — plain text with line breaks
3. Contacts — isPublic only, email/phone links
4. Locations — address cards, no map
5. Services — name, description, price; specials highlighted
6. Photos — grid gallery (legacy URLs, won't load yet)
7. Events — cards with dates and location
8. Coupons — cards with promo code, expiration, small print
9. Reviews — content and date, no rating scores

Empty sections hidden. 404 for unknown slugs.
