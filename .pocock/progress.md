# Progress & Learnings

This file maintains context between autonomous iterations.
**READ THIS FIRST** to understand recent decisions and roadblocks.

---

## Recent Context (Last 3 Iterations)

<!-- This section is a rolling window - keep only the last 3 entries -->
<!-- Move older entries to the Archive section below -->

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
- NOTE: Tailwind theme config is separate issue (SafeReads-zr4)
- NOTE: .env.local template + Convex schema is SafeReads-1tc

---

## Active Roadblocks

<!-- No current roadblocks -->

---

## Project Learnings

Patterns, gotchas, and decisions that affect future work:

### Stack

- Next.js 15 (App Router, TypeScript) on Vercel
- Convex for backend + real-time DB
- Clerk for auth (Google sign-in)
- OpenAI GPT-4o for AI verdict engine
- Tailwind CSS with bookish theme (serif headings, parchment palette)
- Radix UI primitives for accessible components

### Patterns

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

<!-- Move entries here when they roll out of "Recent Context" -->
