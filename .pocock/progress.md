# Progress & Learnings

This file maintains context between autonomous iterations.
**READ THIS FIRST** to understand recent decisions and roadblocks.

---

## Recent Context (Last 3 Iterations)

<!-- This section is a rolling window - keep only the last 3 entries -->
<!-- Move older entries to the Archive section below -->

### Iteration 10 — SafeReads-4fd: Build SearchBar, BookCard, and search page

- Created `src/components/SearchBar.tsx` — search input with submit button
  - Controlled text input with search icon and loading spinner
  - Calls `onSearch(query)` callback on form submit
  - Disabled state while loading
- Created `src/components/BookCard.tsx` — book result card component
  - Shows cover (Next.js Image with fallback BookOpen icon), title, authors, year, page count
  - Description clamped to 2 lines, categories as pills (max 3)
  - Links to `/dashboard/book/{_id}` for future book detail page
  - Exports `BookCardBook` type for consumers
- Updated `src/app/dashboard/page.tsx` — wired search into dashboard
  - Uses `useAction(api.books.search)` for Convex action calls
  - States: loading, searched (empty results), error, results list
  - BookCard list layout (vertical stack, not grid — better for book metadata)
- Updated `next.config.ts` — added `images.remotePatterns` for books.google.com and covers.openlibrary.org
- Renamed Navbar "Dashboard" link to "Search" for clarity
- Build + lint pass clean
- Files: `src/components/SearchBar.tsx` (new), `src/components/BookCard.tsx` (new), `src/app/dashboard/page.tsx` (modified), `next.config.ts` (modified), `src/components/Navbar.tsx` (modified)

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
  - `listByUser` — public query: fetches all profiles for a user via `by_user` index
  - `getById` — public query: single profile fetch by ID
  - `getDefault` — public query: returns default profile (or first, or null)
  - `create` — mutation: creates profile, auto-sets `isDefault` if first profile
  - `update` — mutation: patches name + all 6 sensitivity fields
  - `setDefault` — mutation: unsets current default, sets new one
  - `remove` — mutation: deletes profile, prevents deleting last one, reassigns default if needed
- Created `src/components/ValuesProfileForm.tsx` — reusable form component
  - 6 Radix UI sliders (1-10) for sensitivity settings
  - Profile name text input
  - Human-readable sensitivity labels (Very Relaxed → Very Strict)
  - Accepts `initialName`/`initialValues` for edit mode, `onSubmit` callback
  - Exports `SensitivityValues` type for consumers
- Created `src/app/dashboard/profiles/page.tsx` — profiles management page
  - Lists profiles with default star indicator
  - Create/edit via Radix Dialog modal with ValuesProfileForm
  - Set default, delete (prevented for last profile) actions
  - Uses Clerk `useUser` → Convex `getByClerkId` → `listByUser` chain
- Added "Profiles" nav link to Navbar
- With AnyApi stubs, `useQuery` returns `any` — need explicit type annotations on `.map()` callbacks
- Build + lint pass clean
- Files: `convex/profiles.ts` (new), `src/components/ValuesProfileForm.tsx` (new), `src/app/dashboard/profiles/page.tsx` (new), `src/components/Navbar.tsx` (modified)

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
- BookCard links to `/dashboard/book/{_id}` — book detail page is the next task (SafeReads-t99).

### Testing

<!-- Document testing patterns and gotchas -->

---

## Archive (Older Iterations)

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
