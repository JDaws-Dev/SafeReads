# Progress & Learnings

This file maintains context between autonomous iterations.
**READ THIS FIRST** to understand recent decisions and roadblocks.

---

## Recent Context (Last 3 Iterations)

<!-- This section is a rolling window - keep only the last 3 entries -->
<!-- Move older entries to the Archive section below -->

### Iteration 18 — SafeReads-xza: Mobile-first scan UX

- Redesigned dashboard search controls for mobile-first layout
  - Scanner buttons moved below search bar (stacked layout) instead of cramped side-by-side
  - Both scanner buttons now full-width with text labels ("Scan Barcode", "Photo Cover") for discoverability
  - Buttons use `flex-1` within a `flex gap-2` row so they split space equally
- Scanner modals now use bottom-sheet pattern on mobile
  - `items-end` + `rounded-t-2xl` on mobile → slides up from bottom (natural mobile gesture)
  - `sm:items-center sm:justify-center sm:rounded-xl` → centered dialog on desktop
  - Added explicit "Cancel" button on mobile (sm:hidden) for easy dismissal
  - Close button padded to `p-2` for better touch target
- SearchBar placeholder shortened for mobile ("Title, author, or ISBN…")
  - `text-sm` on mobile, `sm:text-base` on desktop
  - Right padding `pr-20` on mobile, `sm:pr-24` on desktop to fit search button
- Heading scales: `text-2xl` → `sm:text-3xl`, subheading `text-sm` → `sm:text-base`
- No new dependencies
- Build + lint pass clean
- Files: `src/app/dashboard/page.tsx`, `src/components/BarcodeScanner.tsx`, `src/components/CoverScanner.tsx`, `src/components/SearchBar.tsx` (all modified)

### Iteration 17 — SafeReads-w1e: Book cover photo identification via vision AI

- Created `convex/books.ts:identifyCover` action — OpenAI GPT-4o vision for book identification
  - Takes base64-encoded JPEG image of book cover
  - Sends to GPT-4o with `image_url` content block, `detail: "low"` to minimize token cost
  - Extracts title + author from cover image via structured JSON response
  - Reuses existing `searchGoogleBooks` + Open Library enrichment + upsert flow (no duplication)
  - Returns same shape as `books.search` — results drop into existing UI seamlessly
  - Throws descriptive error if title can't be extracted
- Created `src/components/CoverScanner.tsx` — camera capture component
  - Button with `Camera` icon, same styling as BarcodeScanner for consistency
  - Opens modal with live camera preview (rear camera via `facingMode: "environment"`)
  - "Take Photo" button captures frame to canvas → base64 JPEG (0.8 quality)
  - Cleans up camera stream on close/capture/unmount
  - Loading + error states match BarcodeScanner patterns
- Updated `src/app/dashboard/page.tsx` — added CoverScanner next to BarcodeScanner
  - `handleCoverCapture` calls `identifyCover` action, shows results in same list
  - Error messages surface vision AI failures (e.g. "could not identify the book")
  - Disabled while any search/identify is loading
- No new dependencies — uses existing `openai` package and native browser APIs (`getUserMedia`, `canvas`)
- Build + lint pass clean
- Files: `src/components/CoverScanner.tsx` (new), `convex/books.ts` (modified), `src/app/dashboard/page.tsx` (modified)

### Iteration 16 — SafeReads-tpl.7: Research: Replace sensitivity sliders with objective content review

- **Recommendation: Switch to objective content review** (no more sensitivity profiles/sliders)
- Key findings:
  - Current system: 10^6 possible profile combos per book = massive cache fragmentation, high API cost
  - Proposed: ONE analysis per book — dramatically better caching, lower API spend
  - Sliders are confusing UX — "Violence: 7" has no clear meaning to users
  - Profile setup is friction barrier before first value (7 steps → 4 steps)
  - Objective content descriptions are more trustworthy and shareable
- Replace verdict (safe/caution/warning) with age recommendation + severity matrix per category
- Keep contentFlags (category/severity/details) as the core output
- Migration plan: 5 phases — schema, backend, AI prompt, frontend, cleanup
- **No code changes** — this was a research/decision issue
- Files touched: none (research only, findings in issue notes)
- **Next steps**: Implement the migration plan in follow-up issues

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
- Single profile per user. `profiles.getByUser` returns one profile or null. `profiles.upsert` auto-creates on first save.
- `isDefault` field kept in schema for backward compat — always set to `true`.
- Kids no longer link to profiles (per-kid profileId removed from KidForm UI). Schema still has the optional field.
- WishlistButton hidden when user has no kids (returns null).
- Wishlists use (kidId, bookId) composite index for dedup. `add` mutation checks existing before insert.
- Kid deletion cascades to wishlist entries (manual cascade in `kids.remove`).
- VerdictSection orchestrates: Clerk user → Convex user → profile → profileHash → cached analysis query. Falls back to `useAction` for fresh analysis. Action results stored in local state until Convex query picks up the cache.
- `computeProfileHash` from `convex/lib/profileHash` can be imported client-side (pure function, no server deps).
- `html5-qrcode` for barcode scanning: dynamic import (`import("html5-qrcode")`) to avoid SSR. Uses `Html5Qrcode` class — create instance, call `.start()` with camera config, `.stop()` on cleanup. Scanned ISBN barcodes are EAN-13 (13 digits) or ISBN-10 (10 digits).
- BarcodeScanner creates its own container div imperatively (html5-qrcode manages its own DOM). Use a ref to a wrapper div, create child div with unique ID.
- **DECISION (iteration 16)**: Switching from sensitivity sliders to objective content review. One analysis per book (not per book+profile). Removes profiles dependency from analysis flow. See SafeReads-tpl.7 issue notes for full rationale and migration plan.
- CoverScanner uses native `getUserMedia` + `<canvas>` for photo capture — no library needed. Converts video frame to base64 JPEG via `canvas.toDataURL("image/jpeg", 0.8)`. Strip `data:image/jpeg;base64,` prefix before sending to API.
- GPT-4o vision with `detail: "low"` is sufficient for book cover text extraction and keeps token cost minimal.
- Mobile modals use bottom-sheet pattern: `items-end` + `rounded-t-2xl` on mobile, `sm:items-center sm:rounded-xl` on desktop. Always add explicit "Cancel" button on mobile (`sm:hidden`).

### Testing

<!-- Document testing patterns and gotchas -->

---

## Archive (Older Iterations)

### Iteration 15 — SafeReads-ba5: Barcode scanner for ISBN lookup

- Installed `html5-qrcode` for browser-based barcode scanning
- Created `src/components/BarcodeScanner.tsx` — camera modal with ISBN validation
- Updated dashboard page with scanner button
- Build + lint pass clean

### Iteration 14 — SafeReads-tpl.5: Simplify to single profile per user

- Rewrote `convex/profiles.ts` — replaced multi-profile CRUD with two functions
- Rewrote `src/app/dashboard/profiles/page.tsx` — single edit form
- Updated VerdictSection, KidForm, kids page, Navbar
- Build + lint pass clean

### Iteration 13 — SafeReads-bmt: Build kids management and wishlists

- Added `kids` and `wishlists` tables to `convex/schema.ts`
- Created `convex/kids.ts` and `convex/wishlists.ts` — full CRUD modules
- Created kids management page, per-kid wishlist page, WishlistButton component
- Build + lint pass clean

### Iteration 12 — SafeReads-1sw: Build verdict UI components and wire into book detail page

- Created `src/components/VerdictCard.tsx`, `ContentFlagList.tsx`, `AnalyzeButton.tsx`, `VerdictSection.tsx`
- Wired VerdictSection into book detail page
- Build + lint pass clean

### Iteration 11 — SafeReads-t99: Build book detail page with BookHeader and AmazonButton

- Created `src/components/BookHeader.tsx` — full book header component
- Created `src/components/AmazonButton.tsx` — Amazon search link
- Created `src/app/dashboard/book/[id]/page.tsx` — book detail route
- Fixed `convex/_generated/api.d.ts` — reverted to `AnyApi` stub
- Build + lint pass clean

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
