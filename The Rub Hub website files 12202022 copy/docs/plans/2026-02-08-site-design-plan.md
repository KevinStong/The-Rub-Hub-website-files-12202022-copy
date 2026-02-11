# The Rub Hub Site Design — Brand & Layout Reskin

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reskin the entire app to match the wireframe mockups — apply the blue/gold/charcoal brand palette and restructure layouts (sidebar search, hero imagery, multi-section footer).

**Architecture:** Pure visual/CSS changes. No new routes, API endpoints, or data model changes. Brand colors defined as Tailwind 4 `@theme inline` tokens, then applied across ~20 files by swapping Tailwind classes. Directory page gets a sidebar layout. Login/register get hero backgrounds. Footer gets a full redesign.

**Tech Stack:** Next.js 16, Tailwind CSS 4 (`@theme inline`), React 19

**Important context:**
- No tailwind.config.ts — Tailwind 4 uses `@theme inline` in `globals.css`
- No test framework — verify with `npx next build` + visual check at `http://localhost:3001`
- Project root has spaces in path — always quote
- Docker + dev server already running on port 3001

---

### Task 1: Brand Color System

**Files:**
- Modify: `app/src/app/globals.css`

**Step 1: Add brand color tokens to `@theme inline`**

Replace the existing `@theme inline` block with:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);

  --color-brand-blue: #3361CC;
  --color-brand-blue-dark: #2A51A8;
  --color-brand-blue-light: #EBF0FA;
  --color-brand-gold: #F5A623;
  --color-brand-gold-dark: #D4900F;
  --color-brand-gold-light: #FEF7E8;
  --color-brand-charcoal: #3D3D3D;
  --color-brand-charcoal-light: #555555;
}
```

**Step 2: Remove the dark mode media query** (the entire `@media (prefers-color-scheme: dark)` block). This is a light-only brand site.

**Step 3: Verify** — `cd app && npx next build 2>&1 | head -20` should succeed.

**Step 4: Commit** — `git commit -m "feat: add brand color tokens to Tailwind theme"`

---

### Task 2: Header Redesign

**Files:**
- Modify: `app/src/components/layout/header.tsx`

**Changes:**
- `<header>`: `border-b border-zinc-200 bg-white` → `bg-brand-blue shadow-sm`
- `<nav>` padding: `py-4` → `py-3`
- Logo `<Link>`: `text-zinc-900` → `text-white`
- `<ul>` nav: `text-zinc-600` → `text-blue-100`
- All `hover:text-zinc-900` → `hover:text-white`
- Loading `<span>`: `text-zinc-400` → `text-blue-200`
- "Log In" link: convert to bordered button: `rounded-md border border-white px-4 py-1.5 text-white hover:bg-white hover:text-brand-blue transition-colors`

**Commit** — `git commit -m "feat: redesign header with brand blue background"`

---

### Task 3: Footer Redesign

**Files:**
- Modify: `app/src/components/layout/footer.tsx`

**Complete rewrite.** New structure:
1. Gold "Why Join? Learn More" CTA bar (`bg-brand-gold`)
2. Charcoal footer (`bg-brand-charcoal`) with 3 columns:
   - Brand name + italic tagline
   - Navigation links (Home, Directory, About, Contact, Terms)
   - Action buttons (Member Login bordered, Join Free Today gold)
3. Copyright line at bottom

Add `import Link from "next/link"` at top.

**Commit** — `git commit -m "feat: redesign footer with charcoal background and gold CTA bar"`

---

### Task 4: Homepage Hero Redesign

**Files:**
- Modify: `app/src/app/page.tsx`
- Create: `app/public/images/` (add hero image)

**Hero section changes:**
- Background: `bg-zinc-900` → `bg-brand-blue px-4 py-28` (solid blue fallback; hero image added later if available)
- Add dark overlay: `<div className="absolute inset-0 bg-black/40" />`
- Content wrapper: add `relative` to sit above overlay
- Tagline text: change to *"Connecting you with health, wellness, and spa practitioners"*, add `italic text-white/90`
- Search form: split single input into keyword + location side-by-side with glass-style inputs (`bg-white/20 backdrop-blur-sm`)
- Search button: `bg-white text-zinc-900` → `bg-brand-blue text-white hover:bg-brand-blue-dark`

**Category section:**
- Rename "Browse by Category" → "Top Services"
- Tile links: `bg-zinc-100 hover:bg-zinc-200` → `border border-gray-200 bg-white hover:border-brand-blue hover:shadow-sm`
- Provider count text: `text-zinc-500` → `text-brand-blue`

**Commit** — `git commit -m "feat: redesign homepage hero with brand colors and dual search fields"`

---

### Task 5: Directory Page Sidebar Layout

**Files:**
- Modify: `app/src/app/directory/page.tsx`

**Change the layout** from stacked (form above results) to sidebar:

```
<div className="mt-6 flex flex-col gap-8 lg:flex-row">
  <aside className="w-full shrink-0 lg:w-64">
    <SearchForm ... />
  </aside>
  <div className="flex-1">
    {/* results grid + pagination */}
  </div>
</div>
```

Mobile: sidebar stacks on top. Desktop (lg+): 256px sidebar pinned left.

**Commit** — `git commit -m "feat: convert directory to sidebar filter layout"`

---

### Task 6: Search Form Sidebar Conversion

**Files:**
- Modify: `app/src/components/directory/search-form.tsx`

**Changes:**
- Add heading: `<h2 className="text-lg font-semibold text-zinc-900">Refine Your Search</h2>`
- Outer form: wrap in `rounded-lg border border-gray-200 bg-white p-4 shadow-sm`
- Input/button row: `flex-col gap-4 sm:flex-row` → `flex-col gap-3` (always vertical)
- Search button: `bg-zinc-900 hover:bg-zinc-800` → `w-full bg-brand-blue hover:bg-brand-blue-dark`
- Filter grid: `grid-cols-2 sm:grid-cols-4` → `grid-cols-1 gap-3` (single column stack)
- All focus rings: `focus:border-zinc-500 focus:ring-zinc-500` → `focus:border-brand-blue focus:ring-brand-blue`

**Commit** — `git commit -m "feat: convert search form to vertical sidebar layout with brand colors"`

---

### Task 7: Provider Card "View Profile" Button

**Files:**
- Modify: `app/src/components/directory/provider-card.tsx`

**Changes:**
- Outer `<Link>`: add `flex flex-col justify-between`
- Add before `</Link>`: `<span className="mt-4 inline-block self-start rounded-md bg-brand-blue px-4 py-1.5 text-sm font-medium text-white">View Profile</span>`

**Commit** — `git commit -m "feat: add blue View Profile button to provider cards"`

---

### Task 8: Pagination Blue Styling

**Files:**
- Modify: `app/src/components/directory/pagination.tsx`

**Changes:**
- Active page: `bg-zinc-900` → `bg-brand-blue`
- Inactive pages: `border-zinc-300 text-zinc-600 hover:bg-zinc-50` → `border-gray-300 text-brand-blue hover:bg-brand-blue-light`
- Prev/Next: `border-zinc-300 text-zinc-600 hover:bg-zinc-50` → `border-gray-300 text-brand-blue hover:bg-brand-blue-light`

**Commit** — `git commit -m "feat: apply brand blue to pagination controls"`

---

### Task 9: Provider Profile Styling

**Files:**
- Modify: `app/src/app/directory/[slug]/page.tsx` — category/specialty badges: `bg-zinc-100 text-zinc-700` and `bg-blue-50 text-blue-700` → both `bg-brand-blue-light text-brand-blue`
- Modify: `app/src/components/provider/profile-editor.tsx` — edit button: `bg-zinc-100 text-zinc-700 hover:bg-zinc-200` → `bg-brand-blue text-white hover:bg-brand-blue-dark`
- Modify: `app/src/components/provider/services-section.tsx` — price text: `text-zinc-900` → `text-brand-blue`
- Modify: `app/src/components/provider/contact-section.tsx` — links: `text-blue-600` → `text-brand-blue`
- Modify: `app/src/components/provider/location-section.tsx` — cards: add `shadow-sm`

**Commit** — `git commit -m "feat: apply brand colors to provider profile sections"`

---

### Task 10: Login Page Hero Layout

**Files:**
- Modify: `app/src/app/auth/login/page.tsx`

**Restructure** into hero background + two-panel layout:
- Outer wrapper: hero bg with `bg-brand-blue` solid color + dark overlay
- Left panel: login form in white card
- Right panel: "Join Today" CTA card with benefits + gold "Join Now" button
- Submit button: `bg-zinc-900` → `bg-brand-blue hover:bg-brand-blue-dark`
- Focus rings: → `focus:border-brand-blue focus:ring-brand-blue`
- Register link: `text-zinc-900` → `text-brand-blue`

**Commit** — `git commit -m "feat: redesign login page with hero background and Join Today CTA"`

---

### Task 11: Register Page Benefits + Amber CTA

**Files:**
- Modify: `app/src/app/auth/register/page.tsx`

**Changes:**
- Wider container: `max-w-md` → `max-w-2xl`
- Heading: "Create an Account" → "Practitioner Membership"
- Add benefits box below heading (blue-light bg, checkmark list, "FREE OF COST" in gold)
- Submit button: `bg-zinc-900` → `bg-brand-gold hover:bg-brand-gold-dark`, text "Join Now"
- Focus rings: → brand-blue
- Login link: `text-zinc-900` → `text-brand-blue`

**Commit** — `git commit -m "feat: redesign register page with benefits list and gold CTA"`

---

### Task 12: Edit Form Button Styling

**Files (all 6):**
- `app/src/components/provider/edit-forms/bio-form.tsx`
- `app/src/components/provider/edit-forms/contacts-form.tsx`
- `app/src/components/provider/edit-forms/locations-form.tsx`
- `app/src/components/provider/edit-forms/services-form.tsx`
- `app/src/components/provider/edit-forms/events-form.tsx`
- `app/src/components/provider/edit-forms/coupons-form.tsx`

**Pattern across all files:**
- Save buttons: `bg-zinc-900 hover:bg-zinc-800` → `bg-brand-gold hover:bg-brand-gold-dark transition-colors`
- Focus rings on inputs: `focus:ring-zinc-400` → `focus:ring-brand-blue`
- "+ Add" links: `text-blue-600` → `text-brand-blue`

**Commit** — `git commit -m "feat: apply gold save buttons and brand focus rings to edit forms"`

---

### Task 13: Category Page Consistency

**Files:**
- Modify: `app/src/app/category/[slug]/page.tsx`

**Changes:**
- Breadcrumb links: add `text-brand-blue` to Home and Directory links

**Commit** — `git commit -m "feat: apply brand blue to category page breadcrumbs"`

---

### Task 14: Build Verification + Smoke Test

**Step 1:** Run `cd app && npx next build` — must succeed with no errors.

**Step 2:** Visual check at `http://localhost:3001`:
- Header: blue background, white text, bordered login button
- Homepage: hero with overlay, dual search fields, blue button, "Top Services" section
- Footer: charcoal bg, 3 columns, gold CTA bar
- Directory: sidebar filters left, results right (desktop); stacked (mobile)
- Provider cards: blue "View Profile" button
- Pagination: blue active state
- Profile page: blue badges, blue edit buttons, gold save buttons
- Login: hero bg, two-panel layout
- Register: benefits list, gold "Join Now"

**Step 3:** Fix any issues, commit fixes individually.

**Step 4:** Push branch and create PR.

---

### File Change Summary

| Task | Files Modified | Key Change |
|------|---------------|------------|
| 1 | globals.css | 8 brand color tokens |
| 2 | header.tsx | Blue bg + white text |
| 3 | footer.tsx | Full rewrite, charcoal + gold |
| 4 | page.tsx (home) | Hero redesign, dual search |
| 5 | directory/page.tsx | Sidebar flex layout |
| 6 | search-form.tsx | Vertical sidebar form |
| 7 | provider-card.tsx | "View Profile" button |
| 8 | pagination.tsx | Blue active/inactive states |
| 9 | [slug]/page.tsx + 4 components | Profile brand colors |
| 10 | auth/login/page.tsx | Hero + two-panel layout |
| 11 | auth/register/page.tsx | Benefits + gold CTA |
| 12 | edit-forms/*.tsx (6 files) | Gold save, brand focus rings |
| 13 | category/[slug]/page.tsx | Blue breadcrumb links |
| 14 | — | Build + visual verification |

**Total: ~20 files modified, 1 new image asset, 0 new dependencies**
