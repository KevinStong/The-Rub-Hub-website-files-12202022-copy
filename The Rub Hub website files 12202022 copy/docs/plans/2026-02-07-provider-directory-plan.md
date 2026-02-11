# Provider Directory Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a fully functional provider directory with search/filter and individual profile pages.

**Architecture:** Server Components with URL-based search state. Two routes: `/directory` (search with filters + pagination) and `/directory/[slug]` (full profile). The search form is the only client component — everything else is server-rendered. Prisma queries drive all data fetching.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, Prisma 7 (with MariaDB adapter), Tailwind CSS 4

**Important context:**
- Prisma client import: `import { prisma } from "@/lib/prisma"`
- Path alias: `@/*` maps to `./src/*`
- Existing layout: Header + Footer already wrap all pages via `app/src/app/layout.tsx`
- Database has 5,164 providers, 180 categories, 30 specialties with real migrated data
- No test framework is set up yet — we skip TDD for this phase (UI-heavy server components)
- The app runs at `http://localhost:3000` via `npm run dev` inside the `app/` directory
- Docker must be running for database access (`docker compose up -d` from project root)

---

### Task 1: Provider Card Component

**Files:**
- Create: `app/src/components/directory/provider-card.tsx`

**Step 1: Create the provider card component**

This is a server component (no `"use client"`) that displays a single provider in search results.

```tsx
import Link from "next/link";

type ProviderCardProps = {
  provider: {
    slug: string;
    name: string;
    bio: string | null;
    categories: { category: { name: string } }[];
    locations: { city: string; state: string }[];
  };
};

export function ProviderCard({ provider }: ProviderCardProps) {
  const primaryCategory = provider.categories[0]?.category.name;
  const primaryLocation = provider.locations[0];

  return (
    <Link
      href={`/directory/${provider.slug}`}
      className="block rounded-lg border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md"
    >
      <h2 className="text-lg font-semibold text-zinc-900">{provider.name}</h2>
      <div className="mt-1 flex flex-wrap gap-2 text-sm text-zinc-500">
        {primaryCategory && <span>{primaryCategory}</span>}
        {primaryCategory && primaryLocation && (
          <span aria-hidden="true">&middot;</span>
        )}
        {primaryLocation && (
          <span>
            {primaryLocation.city}, {primaryLocation.state}
          </span>
        )}
      </div>
      {provider.bio && (
        <p className="mt-3 line-clamp-2 text-sm text-zinc-600">
          {provider.bio}
        </p>
      )}
    </Link>
  );
}
```

**Step 2: Verify it compiles**

Run: `cd app && npx next build 2>&1 | head -20`
Expected: Build succeeds (component isn't used yet, but should have no syntax errors)

**Step 3: Commit**

```bash
git add app/src/components/directory/provider-card.tsx
git commit -m "feat: add ProviderCard component for directory search results"
```

---

### Task 2: Pagination Component

**Files:**
- Create: `app/src/components/directory/pagination.tsx`

**Step 1: Create the pagination component**

Client component that builds page links preserving existing search params.

```tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
};

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `/directory?${params.toString()}`;
  }

  // Show up to 5 page numbers centered around current page
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav aria-label="Search results pages" className="mt-8 flex items-center justify-center gap-2">
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          Previous
        </Link>
      )}
      {pages.map((page) => (
        <Link
          key={page}
          href={buildHref(page)}
          className={`rounded-md px-3 py-2 text-sm ${
            page === currentPage
              ? "bg-zinc-900 text-white"
              : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          {page}
        </Link>
      ))}
      {currentPage < totalPages && (
        <Link
          href={buildHref(currentPage + 1)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
```

**Step 2: Commit**

```bash
git add app/src/components/directory/pagination.tsx
git commit -m "feat: add Pagination component for directory search"
```

---

### Task 3: Search Form Component

**Files:**
- Create: `app/src/components/directory/search-form.tsx`

**Step 1: Create the search form client component**

This component renders keyword input + filter dropdowns and pushes URL params on submit.

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent } from "react";

type SearchFormProps = {
  categories: { slug: string; name: string }[];
  specialties: { slug: string; name: string }[];
  states: string[];
};

export function SearchForm({ categories, specialties, states }: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();

    const q = formData.get("q") as string;
    const category = formData.get("category") as string;
    const specialty = formData.get("specialty") as string;
    const state = formData.get("state") as string;
    const city = formData.get("city") as string;

    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (specialty) params.set("specialty", specialty);
    if (state) params.set("state", state);
    if (city) params.set("city", city);
    // Reset to page 1 on new search
    params.set("page", "1");

    router.push(`/directory?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          name="q"
          placeholder="Search providers..."
          defaultValue={searchParams.get("q") ?? ""}
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Search
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <select
          name="category"
          defaultValue={searchParams.get("category") ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="specialty"
          defaultValue={searchParams.get("specialty") ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          <option value="">All Specialties</option>
          {specialties.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          name="state"
          defaultValue={searchParams.get("state") ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          <option value="">All States</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="city"
          placeholder="City"
          defaultValue={searchParams.get("city") ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>
    </form>
  );
}
```

**Step 2: Commit**

```bash
git add app/src/components/directory/search-form.tsx
git commit -m "feat: add SearchForm component with keyword, category, specialty, state, city filters"
```

---

### Task 4: Directory Search Page

**Files:**
- Create: `app/src/app/directory/page.tsx`

**Step 1: Create the directory search page**

Server component that reads URL search params, queries Prisma, and renders results.

```tsx
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { SearchForm } from "@/components/directory/search-form";
import { ProviderCard } from "@/components/directory/provider-card";
import { Pagination } from "@/components/directory/pagination";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = {
  title: "Provider Directory — The Rub Hub",
  description: "Find massage therapists and bodywork providers near you.",
};

const PAGE_SIZE = 20;

type SearchParams = Promise<{
  q?: string;
  category?: string;
  specialty?: string;
  state?: string;
  city?: string;
  page?: string;
}>;

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  // Build dynamic where clause
  const where: Prisma.ProviderWhereInput = { status: "active" };

  if (params.q) {
    where.OR = [
      { name: { contains: params.q } },
      { bio: { contains: params.q } },
    ];
  }

  if (params.category) {
    where.categories = {
      some: { category: { slug: params.category } },
    };
  }

  if (params.specialty) {
    where.specialties = {
      some: { specialty: { slug: params.specialty } },
    };
  }

  if (params.state || params.city) {
    const locationFilter: Prisma.LocationWhereInput = {};
    if (params.state) locationFilter.state = params.state;
    if (params.city) locationFilter.city = { contains: params.city };
    where.locations = { some: locationFilter };
  }

  // Fetch filter options + results in parallel
  const [categories, specialties, states, providers, totalCount] =
    await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: { slug: true, name: true },
      }),
      prisma.specialty.findMany({
        orderBy: { name: "asc" },
        select: { slug: true, name: true },
      }),
      prisma.location
        .findMany({
          where: { state: { not: "" } },
          distinct: ["state"],
          select: { state: true },
          orderBy: { state: "asc" },
        })
        .then((rows) => rows.map((r) => r.state)),
      prisma.provider.findMany({
        where,
        include: {
          categories: { include: { category: true } },
          locations: { select: { city: true, state: true }, take: 1 },
        },
        orderBy: { name: "asc" },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.provider.count({ where }),
    ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const start = skip + 1;
  const end = Math.min(skip + PAGE_SIZE, totalCount);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-zinc-900">Provider Directory</h1>
      <p className="mt-2 text-zinc-600">
        Find massage therapists and bodywork providers near you.
      </p>

      <div className="mt-6">
        <Suspense fallback={null}>
          <SearchForm
            categories={categories}
            specialties={specialties}
            states={states}
          />
        </Suspense>
      </div>

      <div className="mt-8">
        {totalCount > 0 ? (
          <>
            <p className="mb-4 text-sm text-zinc-500">
              Showing {start}–{end} of {totalCount} providers
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {providers.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
            <Suspense fallback={null}>
              <Pagination currentPage={page} totalPages={totalPages} />
            </Suspense>
          </>
        ) : (
          <p className="text-zinc-500">
            No providers found. Try adjusting your search filters.
          </p>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify the page renders**

1. Make sure Docker is running: `docker compose up -d` (from project root)
2. Run: `cd app && npm run dev`
3. Open `http://localhost:3000/directory` in a browser
4. Expected: Page shows "Provider Directory" heading, search form with filters, and a grid of provider cards with pagination.
5. Test a search: `http://localhost:3000/directory?q=pilates` — should show filtered results.

**Step 3: Commit**

```bash
git add app/src/app/directory/page.tsx
git commit -m "feat: add directory search page with keyword, category, specialty, location filters"
```

---

### Task 5: Provider Profile — Contact Section

**Files:**
- Create: `app/src/components/provider/contact-section.tsx`

**Step 1: Create the contact section component**

```tsx
type Contact = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isPublic: boolean;
};

export function ContactSection({ contacts }: { contacts: Contact[] }) {
  const publicContacts = contacts.filter((c) => c.isPublic);
  if (publicContacts.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-zinc-900">Contact</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {publicContacts.map((contact) => (
          <div
            key={contact.id}
            className="rounded-lg border border-zinc-200 p-4"
          >
            <p className="font-medium text-zinc-900">
              {contact.firstName} {contact.lastName}
            </p>
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="mt-1 block text-sm text-blue-600 hover:underline"
              >
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="mt-1 block text-sm text-blue-600 hover:underline"
              >
                {contact.phone}
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add app/src/components/provider/contact-section.tsx
git commit -m "feat: add ContactSection component for provider profiles"
```

---

### Task 6: Provider Profile — Location Section

**Files:**
- Create: `app/src/components/provider/location-section.tsx`

**Step 1: Create the location section component**

```tsx
type Location = {
  id: number;
  name: string | null;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  hidden: boolean;
};

export function LocationSection({ locations }: { locations: Location[] }) {
  const visible = locations.filter((l) => !l.hidden);
  if (visible.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-zinc-900">Locations</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {visible.map((loc) => (
          <div
            key={loc.id}
            className="rounded-lg border border-zinc-200 p-4"
          >
            {loc.name && (
              <p className="font-medium text-zinc-900">{loc.name}</p>
            )}
            <p className="text-sm text-zinc-600">{loc.address1}</p>
            {loc.address2 && (
              <p className="text-sm text-zinc-600">{loc.address2}</p>
            )}
            <p className="text-sm text-zinc-600">
              {loc.city}, {loc.state} {loc.zip}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add app/src/components/provider/location-section.tsx
git commit -m "feat: add LocationSection component for provider profiles"
```

---

### Task 7: Provider Profile — Services Section

**Files:**
- Create: `app/src/components/provider/services-section.tsx`

**Step 1: Create the services section component**

```tsx
import type { Decimal } from "@/generated/prisma/client/runtime/library";

type Service = {
  id: number;
  name: string;
  type: string | null;
  price: Decimal | null;
  description: string | null;
  isSpecial: boolean;
  sortOrder: number;
};

export function ServicesSection({ services }: { services: Service[] }) {
  if (services.length === 0) return null;

  const sorted = [...services].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section>
      <h2 className="text-xl font-semibold text-zinc-900">Services</h2>
      <div className="mt-4 space-y-3">
        {sorted.map((service) => (
          <div
            key={service.id}
            className={`rounded-lg border p-4 ${
              service.isSpecial
                ? "border-amber-300 bg-amber-50"
                : "border-zinc-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-zinc-900">
                  {service.name}
                  {service.isSpecial && (
                    <span className="ml-2 inline-block rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Special
                    </span>
                  )}
                </p>
                {service.description && (
                  <p className="mt-1 text-sm text-zinc-600">
                    {service.description}
                  </p>
                )}
              </div>
              {service.price && (
                <span className="shrink-0 text-sm font-semibold text-zinc-900">
                  ${Number(service.price).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add app/src/components/provider/services-section.tsx
git commit -m "feat: add ServicesSection component for provider profiles"
```

---

### Task 8: Provider Profile — Photos, Events, Coupons, Reviews Sections

**Files:**
- Create: `app/src/components/provider/photos-section.tsx`
- Create: `app/src/components/provider/events-section.tsx`
- Create: `app/src/components/provider/coupons-section.tsx`
- Create: `app/src/components/provider/reviews-section.tsx`

**Step 1: Create the photos section**

```tsx
type Photo = {
  id: number;
  name: string | null;
  caption: string | null;
  url: string;
  hidden: boolean;
  sortOrder: number;
};

export function PhotosSection({ photos }: { photos: Photo[] }) {
  const visible = photos.filter((p) => !p.hidden).sort((a, b) => a.sortOrder - b.sortOrder);
  if (visible.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-zinc-900">Photos</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {visible.map((photo) => (
          <div key={photo.id}>
            <img
              src={photo.url}
              alt={photo.caption || photo.name || "Provider photo"}
              className="aspect-square w-full rounded-lg border border-zinc-200 object-cover"
            />
            {photo.caption && (
              <p className="mt-1 text-xs text-zinc-500">{photo.caption}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
```

**Step 2: Create the events section**

```tsx
type Event = {
  id: number;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  city: string | null;
  state: string | null;
  hidden: boolean;
};

export function EventsSection({ events }: { events: Event[] }) {
  const visible = events.filter((e) => !e.hidden);
  if (visible.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-zinc-900">Events</h2>
      <div className="mt-4 space-y-3">
        {visible.map((event) => (
          <div
            key={event.id}
            className="rounded-lg border border-zinc-200 p-4"
          >
            <p className="font-medium text-zinc-900">{event.name}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {new Date(event.startDate).toLocaleDateString()}
              {event.endDate &&
                ` – ${new Date(event.endDate).toLocaleDateString()}`}
              {event.city && event.state && ` · ${event.city}, ${event.state}`}
            </p>
            {event.description && (
              <p className="mt-2 text-sm text-zinc-600">
                {event.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
```

**Step 3: Create the coupons section**

```tsx
type Coupon = {
  id: number;
  name: string;
  description: string | null;
  smallPrint: string | null;
  promoCode: string | null;
  expirationDate: Date | null;
  firstTimeOnly: boolean;
  appointmentOnly: boolean;
  hidden: boolean;
  sortOrder: number;
};

export function CouponsSection({ coupons }: { coupons: Coupon[] }) {
  const visible = coupons
    .filter((c) => !c.hidden)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (visible.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-zinc-900">Coupons</h2>
      <div className="mt-4 space-y-3">
        {visible.map((coupon) => (
          <div
            key={coupon.id}
            className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4"
          >
            <p className="font-medium text-zinc-900">{coupon.name}</p>
            {coupon.description && (
              <p className="mt-1 text-sm text-zinc-600">
                {coupon.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
              {coupon.promoCode && (
                <span className="rounded bg-zinc-200 px-2 py-0.5 font-mono">
                  {coupon.promoCode}
                </span>
              )}
              {coupon.expirationDate && (
                <span>
                  Expires{" "}
                  {new Date(coupon.expirationDate).toLocaleDateString()}
                </span>
              )}
              {coupon.firstTimeOnly && <span>First-time only</span>}
              {coupon.appointmentOnly && <span>Appointment only</span>}
            </div>
            {coupon.smallPrint && (
              <p className="mt-2 text-xs text-zinc-400">{coupon.smallPrint}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
```

**Step 4: Create the reviews section**

```tsx
type Review = {
  id: number;
  content: string;
  status: string;
  createdAt: Date;
};

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const approved = reviews.filter((r) => r.status === "approved");
  if (approved.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-zinc-900">
        Reviews ({approved.length})
      </h2>
      <div className="mt-4 space-y-3">
        {approved.map((review) => (
          <div
            key={review.id}
            className="rounded-lg border border-zinc-200 p-4"
          >
            <p className="text-sm text-zinc-700">{review.content}</p>
            <p className="mt-2 text-xs text-zinc-400">
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

**Step 5: Commit**

```bash
git add app/src/components/provider/photos-section.tsx app/src/components/provider/events-section.tsx app/src/components/provider/coupons-section.tsx app/src/components/provider/reviews-section.tsx
git commit -m "feat: add Photos, Events, Coupons, Reviews section components"
```

---

### Task 9: Provider Profile Page

**Files:**
- Create: `app/src/app/directory/[slug]/page.tsx`

**Step 1: Create the provider profile page**

Server component that fetches a single provider with all relations and renders all sections.

```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContactSection } from "@/components/provider/contact-section";
import { LocationSection } from "@/components/provider/location-section";
import { ServicesSection } from "@/components/provider/services-section";
import { PhotosSection } from "@/components/provider/photos-section";
import { EventsSection } from "@/components/provider/events-section";
import { CouponsSection } from "@/components/provider/coupons-section";
import { ReviewsSection } from "@/components/provider/reviews-section";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const provider = await prisma.provider.findUnique({
    where: { slug },
    select: { name: true, bio: true },
  });

  if (!provider) return { title: "Provider Not Found" };

  return {
    title: `${provider.name} — The Rub Hub`,
    description: provider.bio
      ? provider.bio.slice(0, 160)
      : `View ${provider.name}'s profile on The Rub Hub.`,
  };
}

export default async function ProviderProfilePage({ params }: PageProps) {
  const { slug } = await params;

  const provider = await prisma.provider.findUnique({
    where: { slug },
    include: {
      contacts: true,
      locations: true,
      services: true,
      photos: true,
      events: true,
      coupons: true,
      reviews: true,
      categories: { include: { category: true } },
      specialties: { include: { specialty: true } },
    },
  });

  if (!provider) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <h1 className="text-3xl font-bold text-zinc-900">{provider.name}</h1>
      {provider.categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {provider.categories.map((pc) => (
            <span
              key={pc.categoryId}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
            >
              {pc.category.name}
            </span>
          ))}
        </div>
      )}
      {provider.specialties.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {provider.specialties.map((ps) => (
            <span
              key={ps.specialtyId}
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
            >
              {ps.specialty.name}
            </span>
          ))}
        </div>
      )}

      {/* Bio */}
      {provider.bio && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-zinc-900">About</h2>
          <p className="mt-3 whitespace-pre-line text-zinc-600">
            {provider.bio}
          </p>
        </section>
      )}

      {/* Sections — each hides itself if empty */}
      <div className="mt-8 space-y-10">
        <ContactSection contacts={provider.contacts} />
        <LocationSection locations={provider.locations} />
        <ServicesSection services={provider.services} />
        <PhotosSection photos={provider.photos} />
        <EventsSection events={provider.events} />
        <CouponsSection coupons={provider.coupons} />
        <ReviewsSection reviews={provider.reviews} />
      </div>
    </div>
  );
}
```

**Step 2: Verify the page renders**

1. Run: `cd app && npm run dev`
2. Open `http://localhost:3000/directory` and click a provider card — should navigate to `/directory/[slug]`
3. Expected: Full profile page with all applicable sections (bio, contacts, locations, services, etc.)
4. Test 404: `http://localhost:3000/directory/nonexistent-provider` should show Next.js 404 page.

**Step 3: Commit**

```bash
git add app/src/app/directory/\[slug\]/page.tsx
git commit -m "feat: add provider profile page with all sections"
```

---

### Task 10: Smoke Test & Final Verification

**Step 1: Full smoke test**

1. Ensure Docker is running: `docker compose up -d`
2. Start dev server: `cd app && npm run dev`
3. Test directory page at `http://localhost:3000/directory`:
   - Page loads with 5,164 providers paginated
   - Search "pilates" filters results
   - Select a category from dropdown, submit — results filtered
   - Select a state, submit — results filtered
   - Pagination works (click page 2, page 3)
   - Clear filters shows all providers again
4. Test profile page:
   - Click any provider card — profile loads
   - All non-empty sections render (bio, contacts, locations, services, etc.)
   - Category and specialty tags display
   - Back button returns to search results with filters preserved (URL-based state)
5. Test 404: Visit `/directory/fake-slug-12345` — should 404
6. Test build: `cd app && npx next build` — no errors

**Step 2: Commit any fixes from smoke testing**

If any issues found during smoke test, fix and commit each fix individually.

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: Phase 3 smoke test fixes (if any)"
```

---

### Task 11: Update Phase Document & Create PR

**Step 1: Update `specs/implementation-phases.md`**

Mark Phase 3 work items and verification checkboxes as complete. Change status from blank to `(COMPLETE)`.

**Step 2: Commit and push**

```bash
git add specs/implementation-phases.md
git commit -m "docs: mark Phase 3 Provider Directory as complete"
git push -u origin phase-3-provider-directory
```

**Step 3: Create PR**

```bash
gh pr create --title "Phase 3: Provider directory search and profile pages" --body "$(cat <<'EOF'
## Summary
- Add `/directory` search page with keyword, category, specialty, state/city filters
- Add `/directory/[slug]` provider profile pages with all sections
- Server Components with URL-based search state for SEO and shareable URLs
- 20 results per page with pagination

## Test plan
- [ ] Directory page loads and shows paginated providers
- [ ] Keyword search filters by provider name/bio
- [ ] Category, specialty, and state/city filters work
- [ ] Provider profile pages show all sections (bio, contacts, locations, services, photos, events, coupons, reviews)
- [ ] Empty sections are hidden
- [ ] 404 for nonexistent provider slugs
- [ ] `next build` succeeds without errors

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
