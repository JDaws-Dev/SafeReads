# Progress & Learnings

This file maintains context between autonomous iterations.
**READ THIS FIRST** to understand recent decisions and roadblocks.

---

## Recent Context (Last 3 Iterations)

<!-- This section is a rolling window - keep only the last 3 entries -->
<!-- Move older entries to the Archive section below -->

### Iteration 13 — SafeReads-bmt: Build kids management and wishlists

- Added `kids` and `wishlists` tables to `convex/schema.ts`
  - kids: userId, name, optional age, optional profileId (links to sensitivity profile)
  - wishlists: kidId, bookId, optional note. Indexed by kid and by (kid, book) for dedup
- Created `convex/kids.ts` — full CRUD module
  - listByUser, getById, create, update, remove
  - remove cascades: deletes all wishlist entries for the kid
- Created `convex/wishlists.ts` — full CRUD module
  - listByKid (joins book data), isOnWishlist, add (dedup), updateNote, remove, removeByKidAndBook
  - add prevents duplicate entries via index lookup
- Created `src/components/KidForm.tsx` — reusable form for kid create/edit
  - Name input (required), age input (optional, 0-18), profile select dropdown (optional)
  - Receives profiles list for the select options
- Created `src/app/dashboard/kids/page.tsx` — kids management page
  - Lists kids with avatar, name, age, linked profile name
  - Each kid has Wishlist link, Edit button, Delete button
  - Dialog-based create/edit using Radix Dialog + KidForm
  - Empty state with "Add Your First Child" CTA
- Created `src/app/dashboard/kids/[kidId]/wishlist/page.tsx` — per-kid wishlist page
  - Lists wishlist books with cover thumbnail, title, authors, year
  - Each item links to book detail page, has remove button
  - Empty state with "Search Books" CTA
- Created `src/components/WishlistButton.tsx` — add-to-wishlist button for book detail page
  - Opens dialog listing user's kids with toggle per kid
  - Each row shows checkmark if book already on that kid's wishlist
  - Click toggles add/remove. Hidden when user has no kids
- Updated `src/app/dashboard/book/[id]/page.tsx` — added WishlistButton alongside AmazonButton
- Updated `src/components/Navbar.tsx` — added "Kids" nav link between Search and Profiles
- Reverted `convex/_generated/api.d.ts` to `AnyApi` stub (was overwritten by `npx convex dev`)
- Build + lint pass clean
- Files: `convex/schema.ts` (modified), `convex/kids.ts` (new), `convex/wishlists.ts` (new), `src/components/KidForm.tsx` (new), `src/components/WishlistButton.tsx` (new), `src/app/dashboard/kids/page.tsx` (new), `src/app/dashboard/kids/[kidId]/wishlist/page.tsx` (new), `src/app/dashboard/book/[id]/page.tsx` (modified), `src/components/Navbar.tsx` (modified), `convex/_generated/api.d.ts` (reverted)

### Iteration 12 — SafeReads-1sw: Build verdict UI components and wire into book detail page

- Created `src/components/VerdictCard.tsx` — verdict result display
  - Color-coded card (green/yellow/red/gray) matching verdict type
  - Shield icon variants per verdict, verdict badge, age recommendation pill
  - Summary text, collapsible reasoning via `<details>`
  - Uses theme verdict colors (`verdict-safe`, `verdict-caution`, `verdict-warning`, `verdict-none`)
  - Exports `VerdictCardAnalysis` type
- Created `src/components/ContentFlagList.tsx` — content flags list
  - Color-coded severity dots (none/mild/moderate/heavy)
  - Category name, severity label, details per flag
  - Exports `ContentFlag` type
- Created `src/components/AnalyzeButton.tsx` — analyze trigger button
  - Sparkles icon, loading spinner state, disabled handling
  - Parchment-themed button styling matching existing buttons
- Created `src/components/VerdictSection.tsx` — orchestrator component
  - Fetches Clerk user → Convex user → default profile → cached analysis
  - Uses `computeProfileHash` to check cache via `useQuery(api.analyses.getByBookAndProfile)`
  - Falls back to `useAction(api.analyses.analyze)` when no cache
  - Displays profile name, prompts profile creation if none exists
  - Error handling for failed analysis
- Updated `src/app/dashboard/book/[id]/page.tsx` — wired VerdictSection below BookHeader
- Build + lint pass clean
- Files: `src/components/VerdictCard.tsx` (new), `src/components/ContentFlagList.tsx` (new), `src/components/AnalyzeButton.tsx` (new), `src/components/VerdictSection.tsx` (new), `src/app/dashboard/book/[id]/page.tsx` (modified)

### Iteration 11 — SafeReads-t99: Build book detail page with BookHeader and AmazonButton

- Created `src/components/BookHeader.tsx` — full book header component
  - Large cover image (176×256) with Image fallback, priority loading
  - Title (serif h1), authors, year, page count, ISBN display
  - Category pills (no max limit — detail page shows all)
  - Full description (no line-clamp — detail page shows everything)
  - `actions` slot for composing action buttons (AmazonButton, future verdict trigger)
  - Exports `BookHeaderBook` type
- Created `src/components/AmazonButton.tsx` — Amazon search link
  - Builds Amazon search URL with ISBN (exact match) or title+author fallback
  - Opens in new tab with `noopener noreferrer`
  - ExternalLink icon, parchment-themed button styling
- Created `src/app/dashboard/book/[id]/page.tsx` — book detail route
  - Uses `useQuery(api.books.getById)` for real-time book data
  - Next.js 16 async params: `params: Promise<{ id: string }>` unwrapped with `use()`
  - Loading state with spinner, 404 state with back link
  - Back to search link at top
  - Placeholder comment for verdict section (SafeReads-1sw)
- Fixed `convex/_generated/api.d.ts` — reverted to `AnyApi` stub (was overwritten to `ApiFromModules` causing circular type inference error)
- Build + lint pass clean
- Files: `src/components/BookHeader.tsx` (new), `src/components/AmazonButton.tsx` (new), `src/app/dashboard/book/[id]/page.tsx` (new), `convex/_generated/api.d.ts` (fixed)

---

## Active Roadblocks

<!-- No current roadblocks -->

---

## Project Learnings

Patterns, gotchas, and decisions that affect future work:

### Stack

- Next.js 16 (App Router, TypeScript) on Vercel
- Convex for backend + real-time DB
- Clerk for auth (Google sign-in)
- OpenAI GPT-4o for AI verdict engine
- Tailwind CSS with bookish theme (serif headings, parchment palette)
- Radix UI primitives for accessible components

### Patterns

- Next.js 16: use `proxy.ts` not `middleware.ts` (deprecated). Same API, just renamed.
- ClerkProvider needs `dynamic` prop to avoid build errors when env vars aren't set
- Provider nesting: ClerkProvider (server) > ConvexClientProvider (client "use client") > app
- `src/` directory structure with App Router
- Convex actions for external API calls (Google Books, Open Library, OpenAI)
- Convex queries/mutations for DB reads/writes
- Profile hash for analysis caching: deterministic string concat of 6 sensitivity settings
- Books cached permanently (metadata is static)
- Analyses keyed by (bookId, profileHash) so profile changes auto-invalidate
- `convex/_generated/` stubs exist for builds without deployment — re-export generics from convex/server. Real codegen overwrites these when `npx convex dev` runs.
- `convex/_generated/api.d.ts` must use `AnyApi` (not `ApiFromModules<typeof modules>`) in stubs — importing module types that themselves import from `api` creates circular type inference errors. Real codegen handles this differently.
- Google Books API works without API key (lower rate limits). Key is optional env var.
- Open Library fallback: ISBN lookup → title+author search → work details. Description field is polymorphic (string | {type, value}). Best-effort only — wrapped in try/catch.
- Book upsert deduplicates by `googleBooksId` index — patches existing records to enrich data over time.
- With `AnyApi` stubs, `useQuery` returns `any` — always add explicit type annotations on `.map()` callbacks and similar to satisfy `noImplicitAny`.
- Convex auth config: `convex/auth.config.ts` exports `{ providers: [{ domain, applicationID }] }`. Domain comes from `CLERK_JWT_ISSUER_DOMAIN` env var. No JWT template needed with newer Clerk/Convex integration.
- Convex actions use `useAction` (not `useQuery`/`useMutation`). Actions require manual loading/error state — they don't auto-subscribe like queries.
- Next.js Image component requires `images.remotePatterns` in `next.config.ts` for external image hosts (books.google.com, covers.openlibrary.org).
- BookCard links to `/dashboard/book/{_id}` — book detail page is SafeReads-t99.
- Next.js 16 dynamic route params are `Promise` — use `use(params)` in client components to unwrap. Type: `params: Promise<{ id: string }>`.
- `convex/_generated/api.d.ts` gets overwritten by `npx convex dev` to use `ApiFromModules` — must revert to `AnyApi` stub for builds without Convex deployment.
- Kids link to profiles optionally — `profileId` on kid is nullable. WishlistButton hidden when user has no kids (returns null).
- Wishlists use (kidId, bookId) composite index for dedup. `add` mutation checks existing before insert.
- Kid deletion cascades to wishlist entries (manual cascade in `kids.remove`).
- VerdictSection orchestrates: Clerk user → Convex user → default profile → profileHash → cached analysis query. Falls back to `useAction` for fresh analysis. Action results stored in local state until Convex query picks up the cache.
- `computeProfileHash` from `convex/lib/profileHash` can be imported client-side (pure function, no server deps).

### Testing

<!-- Document testing patterns and gotchas -->

---

## Archive (Older Iterations)

### Iteration 10 — SafeReads-4fd: Build SearchBar, BookCard, and search page

- Created `src/components/SearchBar.tsx` — search input with submit button
- Created `src/components/BookCard.tsx` — book result card component
- Updated `src/app/dashboard/page.tsx` — wired search into dashboard
- Updated `next.config.ts` — added `images.remotePatterns`
- Renamed Navbar "Dashboard" link to "Search"
- Build + lint pass clean

### Iteration 9 — SafeReads-tpl.1: Configure Convex auth.config.ts for Clerk integration

- Created `convex/auth.config.ts` — Convex auth config for Clerk JWT verification
  - Uses `CLERK_JWT_ISSUER_DOMAIN` env var for Clerk issuer domain
  - `applicationID: "convex"` — standard Convex/Clerk integration pattern
- Added `CLERK_JWT_ISSUER_DOMAIN` to `.env.local.example` with comment
- ConvexProviderWithClerk was already wired in root layout (iteration 4)
- Build + lint pass clean
- Files: `convex/auth.config.ts` (new), `.env.local.example` (modified)

### Iteration 8 — SafeReads-2eg: Build profiles CRUD and ValuesProfileForm

- Created `convex/profiles.ts` — full CRUD module for sensitivity profiles
- Created `src/components/ValuesProfileForm.tsx` — reusable form with 6 sliders
- Created `src/app/dashboard/profiles/page.tsx` — profiles management page
- Build + lint pass clean

### Iteration 7 — SafeReads-5g4: Build Google Books API action and Open Library fallback

- Created `convex/books.ts` — full book search + caching module
- Open Library fallback strategy: ISBN → search → work details (3-tier)
- Google Books API key is optional
- Build + lint pass clean

### Iteration 6 — SafeReads-pqw: Build profile hash and AI verdict engine

- Created `convex/lib/profileHash.ts` — `computeProfileHash()` utility
- Created `convex/analyses.ts` — full verdict engine module (analyze action, cache queries, store mutation)
- Updated `convex/_generated/api.d.ts` — simplified to `AnyApi` types to avoid circular type reference
- Build + lint pass clean

### Iteration 5 — SafeReads-aa5: Implement convex/users.ts and basic Navbar + dashboard layout

- Created `convex/users.ts` — upsert mutation + getByClerkId query
- Created `convex/_generated/` stubs (server.js/d.ts, dataModel.d.ts, api.js/d.ts)
- Created `src/components/Navbar.tsx`, dashboard layout + page
- Build + lint pass clean

### Iteration 4 — SafeReads-yau: Root layout with ClerkProvider + ConvexProviderWithClerk

- Created `src/components/ConvexClientProvider.tsx` — "use client" component wrapping ConvexProviderWithClerk
- Updated `src/app/layout.tsx` — wrapped with `<ClerkProvider dynamic>` → `<ConvexClientProvider>`
- Created `src/proxy.ts` — Next.js 16 uses proxy.ts (not middleware.ts, deprecated)
- Build + lint pass clean

### Iteration 3 — SafeReads-zr4: Configure Tailwind with bookish theme

- Tailwind v4 CSS-first config, parchment + ink palettes, verdict semantic colors
- Libre Baskerville serif font for headings, Inter for body
- Build + lint pass clean

### Iteration 2 — SafeReads-1tc: .env.local template and Convex schema

- Created `.env.local.example` with CONVEX_DEPLOYMENT, NEXT_PUBLIC_CONVEX_URL, Clerk keys, OPENAI_API_KEY
- Created `convex/schema.ts` with 4 tables: users, profiles, books, analyses
- Schema design decisions:
  - users: indexed by clerkId for Clerk webhook sync
  - profiles: 6 numeric sensitivity sliders (violence, language, sexualContent, substanceUse, darkThemes, religiousSensitivity) + isDefault flag
  - books: supports both googleBooksId and openLibraryKey, indexed by googleBooksId and isbn13
  - analyses: verdict enum (safe/caution/warning/no_verdict), contentFlags array with category+severity+details, indexed by (bookId, profileHash)
- Build + lint pass clean
- Files: `.env.local.example` (new), `convex/schema.ts` (new)

### Iteration 1 — SafeReads-5i8: Scaffold Next.js project

- Scaffolded via `create-next-app@latest` (Next.js 16.x / React 19.x — latest stable)
- Used `--app --src-dir --typescript --tailwind --eslint --turbopack`
- Replaced default Geist fonts with Inter (bookish theme will add Libre Baskerville later)
- Stripped boilerplate page/layout to minimal SafeReads placeholders
- Installed all deps: Convex, @clerk/nextjs, Radix UI primitives (dialog, dropdown-menu, slider, switch, tabs, tooltip), lucide-react, openai
- Created directory structure: `src/app/dashboard/`, `src/components/`, `convex/lib/`
- Build + lint pass clean
