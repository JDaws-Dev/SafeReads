# Progress & Learnings

This file maintains context between autonomous iterations.
**READ THIS FIRST** to understand recent decisions and roadblocks.

---

## Recent Context (Last 3 Iterations)

<!-- This section is a rolling window - keep only the last 3 entries -->
<!-- Move older entries to the Archive section below -->

### Iteration 6 — SafeReads-pqw: Build profile hash and AI verdict engine

- Created `convex/lib/profileHash.ts` — `computeProfileHash()` utility
  - Deterministic join of 6 sensitivity values with "-" separator
  - e.g. "3-5-2-7-4-6" for violence=3, language=5, etc.
- Created `convex/analyses.ts` — full verdict engine module
  - `getByBookAndProfile` — public query for frontend cache lookups by (bookId, profileHash) index
  - `getCachedAnalysis` — internal query (same logic) for use by the action
  - `getBookById` / `getProfileById` — internal queries for action to fetch DB docs
  - `store` — internal mutation to persist analysis results
  - `analyze` — public action: the main verdict engine
    - Fetches book + profile → computes profileHash → checks cache
    - Returns "no_verdict" early if book lacks description and categories
    - Calls OpenAI GPT-4o with `response_format: { type: "json_object" }`
    - System prompt instructs structured JSON with verdict, ageRecommendation, summary, contentFlags (6 categories), reasoning
    - Validates verdict + severity enums from OpenAI response (falls back to safe defaults)
    - Stores result via internal mutation and returns it
  - Helper functions: `sensitivityLevel()` maps 1-10 to human labels, `buildSensitivityLabels()` and `buildBookContext()` format the prompt
- Updated `convex/_generated/api.d.ts` — simplified to `AnyApi` types to avoid circular type reference
  - Previous stub used `ApiFromModules<{ analyses: typeof analyses }>` which created circular inference when `analyses.ts` imports `internal` from `api`
  - `AnyApi` breaks the cycle; real codegen overwrites this anyway
- Build + lint pass clean
- Files: `convex/lib/profileHash.ts` (new), `convex/analyses.ts` (new), `convex/_generated/api.d.ts` (modified)

### Iteration 5 — SafeReads-aa5: Implement convex/users.ts and basic Navbar + dashboard layout

- Created `convex/users.ts` — upsert mutation + getByClerkId query
- Created `convex/_generated/` stubs (server.js/d.ts, dataModel.d.ts, api.js/d.ts)
- Created `src/components/Navbar.tsx`, dashboard layout + page
- Build + lint pass clean

### Iteration 4 — SafeReads-yau: Root layout with ClerkProvider + ConvexProviderWithClerk

- Created `src/components/ConvexClientProvider.tsx` — "use client" component wrapping ConvexProviderWithClerk
  - Instantiates ConvexReactClient with NEXT_PUBLIC_CONVEX_URL
  - Passes `useAuth` from @clerk/nextjs for token flow
- Updated `src/app/layout.tsx` — wrapped with `<ClerkProvider dynamic>` → `<ConvexClientProvider>`
  - `dynamic` prop avoids build-time prerendering errors when CLERK keys not set
  - Provider order: ClerkProvider (server) > ConvexClientProvider (client) > children
- Created `src/proxy.ts` — Next.js 16 uses proxy.ts (not middleware.ts, deprecated)
  - Uses clerkMiddleware + createRouteMatcher to protect /dashboard(.*)
  - Standard matcher config excludes static assets and _next internals
- Build + lint pass clean
- Files: `src/components/ConvexClientProvider.tsx` (new), `src/app/layout.tsx` (modified), `src/proxy.ts` (new)

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

### Testing

<!-- Document testing patterns and gotchas -->

---

## Archive (Older Iterations)

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
