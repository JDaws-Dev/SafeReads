# Progress & Learnings

This file maintains context between autonomous iterations.
**READ THIS FIRST** to understand recent decisions and roadblocks.

---

## Recent Context (Last 3 Iterations)

<!-- This section is a rolling window - keep only the last 3 entries -->
<!-- Move older entries to the Archive section below -->

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

### Iteration 3 — SafeReads-zr4: Configure Tailwind with bookish theme

- Tailwind v4 CSS-first config (no tailwind.config.ts — theme lives in globals.css `@theme inline`)
- Added Libre Baskerville font (400, 700 weights) via next/font/google as `--font-serif`
- Parchment palette: 10 shades from cream (#fdf8f0) to deep brown (#6c4025)
- Ink palette: 10 shades for text from light (#f6f5f4) to near-black (#2a2622)
- Verdict semantic colors: safe (green), caution (amber), warning (red), none (gray)
- Base body styles: parchment-50 bg, ink-900 text
- Usage: `text-parchment-500`, `bg-ink-900`, `text-verdict-safe`, `font-serif` for headings
- Build + lint pass clean
- Files: `src/app/globals.css` (modified), `src/app/layout.tsx` (modified)

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

### Testing

<!-- Document testing patterns and gotchas -->

---

## Archive (Older Iterations)

### Iteration 1 — SafeReads-5i8: Scaffold Next.js project

- Scaffolded via `create-next-app@latest` (Next.js 16.x / React 19.x — latest stable)
- Used `--app --src-dir --typescript --tailwind --eslint --turbopack`
- Replaced default Geist fonts with Inter (bookish theme will add Libre Baskerville later)
- Stripped boilerplate page/layout to minimal SafeReads placeholders
- Installed all deps: Convex, @clerk/nextjs, Radix UI primitives (dialog, dropdown-menu, slider, switch, tabs, tooltip), lucide-react, openai
- Created directory structure: `src/app/dashboard/`, `src/components/`, `convex/lib/`
- Build + lint pass clean
