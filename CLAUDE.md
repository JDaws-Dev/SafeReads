# SafeReads

AI-powered book content analysis for parents. Search books, get safety verdicts based on your family's values profile.

## Stack

- Next.js 15 (App Router, TypeScript, `src/` directory)
- Convex (backend, real-time DB, actions for external APIs)
- Clerk (auth, Google sign-in)
- OpenAI GPT-4o (AI verdict engine with structured JSON output)
- Tailwind CSS (bookish theme: parchment palette, Libre Baskerville + Inter)
- Radix UI primitives for accessible components
- Lucide React for icons

## Commands

```bash
npm run dev          # Start Next.js dev server
npx convex dev       # Start Convex dev server (run alongside npm run dev)
npm run build        # Production build
npm run lint         # ESLint
```

## Architecture

- **Convex actions** for external API calls (Google Books, Open Library, OpenAI)
- **Convex queries/mutations** for DB reads/writes
- **Profile hash** for analysis caching: deterministic concat of 6 sensitivity settings
- Books cached permanently (metadata is static)
- Analyses keyed by `(bookId, profileHash)` — profile changes auto-invalidate cache
- "No Verdict" returned when insufficient book data

## Key Directories

```
src/app/                    # Next.js App Router pages
src/app/dashboard/          # Authenticated pages (protected by middleware)
src/components/             # React components
convex/                     # Convex backend (schema, queries, mutations, actions)
convex/lib/                 # Shared utilities (profile hash, etc.)
```

## Quality Gates

All must pass before committing:
1. `npm run build` — no TypeScript or build errors
2. `npm run lint` — no ESLint errors

## Philosophy

This codebase will outlive you. Fight entropy. Leave it better than you found it.
