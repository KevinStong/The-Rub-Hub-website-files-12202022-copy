# Phase 4: Auth, Inline Editing & Homepage — Design

## Overview

Phase 4 turns The Rub Hub from a read-only directory into a product providers can manage. Three workstreams in order:

1. **Authentication** — email/password login and registration for providers
2. **Inline Profile Editing** — providers edit their own profile directly on their public page
3. **Homepage & Landing Pages** — search-forward homepage and category landing pages

## 1. Authentication

**Library:** Auth.js (NextAuth v5) with the Credentials provider.

**Routes:**
- `/login` — email + password form
- `/register` — name, email, password, confirm password

**Behavior:**
- Passwords hashed with bcrypt, stored in `User.passwordHash`
- Session via encrypted HTTP-only cookie
- `User` model gets a `role` field (`provider` for now)
- On registration, a `Provider` record is automatically created and linked via `User.provider`
- No social login — email/password only

**Protected routes:**
- `/directory/[slug]` — public, but shows edit controls if the logged-in user owns this provider
- `/login` and `/register` redirect to provider's profile if already logged in
- Header shows "Log in" / "Log out" link

**No separate dashboard URL.** The provider's public profile is their dashboard when logged in.

## 2. Inline Profile Editing

**UX:** When a provider views their own profile, each section shows an "Edit" button. Clicking it swaps that section to an edit form. Save or cancel returns to display mode. One section editable at a time.

**Components:**
- Each display section (ContactSection, ServicesSection, etc.) gets a companion edit form component
- A wrapper detects "is this my profile?" from the auth session and conditionally renders edit buttons
- Edit forms are client components that POST to API routes on save

**API routes:**
- `PUT /api/provider/bio` — name, bio
- `PUT /api/provider/contacts` — contacts array
- `PUT /api/provider/locations` — locations array
- `PUT /api/provider/services` — services array
- `PUT /api/provider/events` — events array
- `PUT /api/provider/coupons` — coupons array
- All routes verify session ownership

**Editable:** Name, bio, contacts, locations, services, events, coupons.
**Read-only:** Photos (upload deferred), reviews (user-submitted).

## 3. Homepage & Landing Pages

**Homepage (`/`):**
- Hero with search bar (keyword + location) → submits to `/directory`
- Category tiles grid linking to `/directory?category=slug`
- Featured providers row — 4-6 random active providers with photos
- Tagline: "Find massage therapists and bodywork providers near you"

**Category landing pages (`/category/[slug]`):**
- Heading, brief description, pre-filtered directory search results
- Reuses Phase 3 search result components
- SEO-friendly dedicated URLs per category

**Layout:**
- Shared header: Home, Directory, Log In / provider name
- Simple footer with links

## Decisions

- **Providers only** — no consumer accounts, no admin panel this phase
- **No social login** — email/password only, social can be added later
- **No photo uploads** — legacy photo URLs stay as-is, upload deferred
- **No separate dashboard** — inline editing on the public profile page
- **No geo/radius search** — still using state/city text filters from Phase 3
