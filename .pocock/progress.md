# Progress & Learnings

This file maintains context between autonomous iterations.
**READ THIS FIRST** to understand recent decisions and roadblocks.

---

## Recent Context (Last 3 Iterations)

<!-- This section is a rolling window - keep only the last 3 entries -->
<!-- Move older entries to the Archive section below -->

### Iteration 30 — SafeReads-cm4.1: Install Stripe SDK and update Convex schema

- Installed `stripe` npm package
- Added 5 subscription fields to users table in `convex/schema.ts`:
  - `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus` (union of active/canceled/past_due/incomplete), `subscriptionCurrentPeriodEnd` (epoch number), `analysisCount`
  - All fields `v.optional()` — existing users get `undefined`, treated as free tier
- Added `by_stripe_customer_id` index on users table
- No new patterns or decisions beyond what's in the issue design
- Build + lint pass clean
- Files: `convex/schema.ts` (modified), `package.json` (modified), `package-lock.json` (modified)

### Iteration 29 — SafeReads-3k3: AI Chat Advisor Feature

- Added `conversations` and `messages` tables to `convex/schema.ts`
- Created `convex/chat.ts` — full chat backend module
  - Queries: `listConversations`, `getMessages`
  - Mutations: `createConversation`, `deleteConversation`
  - Internal: `storeMessage`, `updateTitle`, `getMessagesInternal`, `getConversationInternal`, `getKidsInternal`
  - Action: `sendMessage` — stores user msg, loads context (kids + recent analyses + last 20 msgs), calls GPT-4o, stores response, auto-titles from first message
- Added `listRecentInternal` internalQuery to `convex/analyses.ts` — recent analyses with book data for chat context
- Created 4 chat UI components: `ChatMessage`, `ChatInput`, `ConversationList`, `ChatWindow`
- Created `/dashboard/chat` page — side-by-side layout on desktop (conversation list + chat), stacked on mobile with back button
- Updated `Navbar.tsx` — added Chat link after Kids
- Updated `BottomNav.tsx` — added Chat as 5th item with MessageCircle icon
- **Decision**: No streaming (Convex actions return complete results). Typing indicator (spinner) covers the wait UX. Auto-title from first user message (50 char truncation).
- **Decision**: Context sent to GPT-4o includes kids names/ages + last 5 global recent analyses + last 20 messages in conversation. Keeps token usage reasonable.
- No new dependencies
- Build + lint pass clean
- Files: `convex/schema.ts` (modified), `convex/analyses.ts` (modified), `convex/chat.ts` (new), `convex/_generated/api.d.ts` (modified), `src/components/ChatMessage.tsx` (new), `src/components/ChatInput.tsx` (new), `src/components/ConversationList.tsx` (new), `src/components/ChatWindow.tsx` (new), `src/app/dashboard/chat/page.tsx` (new), `src/components/Navbar.tsx` (modified), `src/components/BottomNav.tsx` (modified)

### Iteration 28 — SafeReads-3xr: Push notifications for analysis completion

- Created `src/hooks/useNotification.ts` — browser Notifications API hook
  - `permission` state (default/granted/denied/unsupported), lazy initialized
  - `requestPermission()` — requests browser notification permission
  - `notify()` — fires notification only when page is not visible (user tabbed away)
- Created `src/components/NotificationBell.tsx` — bell icon in Navbar
  - Click to request permission (default state), shows active bell (granted), disabled bell-off (denied), hidden (unsupported)
- Updated `VerdictSection.tsx` — fires browser notification on analysis/re-analysis completion with verdict result
- Updated `Navbar.tsx` — added NotificationBell next to UserButton
- **Decision**: Used browser Notifications API (not full Web Push with service workers/VAPID) — analyses complete synchronously while user waits, so notifications only help when user has tabbed away. No backend changes needed.
- No new dependencies
- Build + lint pass clean
- Files: `src/hooks/useNotification.ts` (new), `src/components/NotificationBell.tsx` (new), `src/components/VerdictSection.tsx` (modified), `src/components/Navbar.tsx` (modified)

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
- **DECISION (iteration 16, implemented iteration 20)**: Switched from sensitivity sliders to objective content review. One analysis per book (not per book+profile). Analyses no longer depend on profiles. `convex/lib/profileHash.ts` deleted. Schema uses `by_book` index instead of `by_book_and_profile`. VerdictSection no longer needs Clerk user or profile lookup.
- CoverScanner uses native `getUserMedia` + `<canvas>` for photo capture — no library needed. Converts video frame to base64 JPEG via `canvas.toDataURL("image/jpeg", 0.8)`. Strip `data:image/jpeg;base64,` prefix before sending to API.
- GPT-4o vision with `detail: "low"` is sufficient for book cover text extraction and keeps token cost minimal.
- Mobile modals use bottom-sheet pattern: `items-end` + `rounded-t-2xl` on mobile, `sm:items-center sm:rounded-xl` on desktop. Always add explicit "Cancel" button on mobile (`sm:hidden`).
- Browser Notifications API (`new Notification()`) for in-page notifications — no service worker needed. Use lazy `useState` initializer (not `useEffect` + `setState`) to read `Notification.permission` to avoid React lint error `react-hooks/set-state-in-effect`. Only fire notification when `document.visibilityState !== "visible"` (user tabbed away).
- Web Share API (`navigator.share()`) for mobile native sharing — clipboard fallback for desktop. Check `navigator.share` exists before calling. Catch `AbortError` (user cancelled) silently.
- Convex chat pattern: action `sendMessage` stores user msg via internalMutation, loads context (kids, analyses, last 20 msgs) via internalQueries, calls GPT-4o, stores assistant msg. No streaming — Convex actions return complete results. `useQuery(api.chat.getMessages)` auto-updates reactively when new messages are stored, so the UI picks up both user and assistant messages without manual state management. Typing indicator shown via local `isSending` state during the action call.

### Testing

<!-- Document testing patterns and gotchas -->

---

## Archive (Older Iterations)

### Iteration 27 — SafeReads-tpl.2: Add Amazon affiliate tag support

- Updated `AmazonButton` to read `NEXT_PUBLIC_AMAZON_AFFILIATE_TAG` env var
- When set, appends `tag=<value>` to Amazon search URL params
- When unset, button works exactly as before (no change in behavior)
- Added env var to `.env.local.example` with comment
- No new dependencies
- Build + lint pass clean
- Files: `src/components/AmazonButton.tsx` (modified), `.env.local.example` (modified)

### Iteration 26 — SafeReads-i3n: Share verdict with co-parent

- Created `src/components/ShareVerdictButton.tsx` — share button for verdict results
  - Web Share API on mobile (native share sheet — text/WhatsApp/email/etc.)
  - Clipboard fallback on desktop with "Copied!" feedback
  - Formatted share text: emoji verdict badge, book title, verdict label, age recommendation, summary, link
- Updated `VerdictSection.tsx` — added `bookTitle` prop, ShareVerdictButton in action bar next to Report and Re-analyze
- Updated book detail page — passes `bookTitle` to VerdictSection
- No backend changes needed — analyses are global per-book, not per-user private data
- No new dependencies
- Build + lint pass clean
- Files: `src/components/ShareVerdictButton.tsx` (new), `src/components/VerdictSection.tsx` (modified), `src/app/dashboard/book/[id]/page.tsx` (modified)

### Iteration 25 — SafeReads-0uf: Build alternatives suggestions and reports system

- Added reports table, convex/reports.ts CRUD, suggestAlternatives action
- Created ReportButton (Radix Dialog) and AlternativesSuggestions components
- Updated VerdictSection and book detail page
- Build + lint pass clean

### Iteration 24 — SafeReads-tpl.6: Add re-analyze button to bypass verdict cache

- Extracted runOpenAIAnalysis helper, added reanalyze action, deleteByBook mutation
- Updated VerdictSection with Re-analyze button
- Build + lint pass clean

### Iteration 23 — SafeReads-zve: Build notes and search history pages

- Added `notes` table to schema: `userId`, `bookId`, `content` — indexes `by_user` and `by_user_and_book`
- Added `searchHistory` table to schema: `userId`, `query`, `resultCount` — index `by_user`
- Created `convex/notes.ts`: `getByUserAndBook`, `listByUser` (with book data), `upsert` (create-or-update), `remove`
- Created `convex/searchHistory.ts`: `listByUser`, `record`, `clearAll`
- Created `/dashboard/history` page with tabbed UI (Searches / Notes)
- Created `src/components/BookNotes.tsx` — inline note editor on book detail page
- No new dependencies
- Build + lint pass clean

### Iteration 22 — SafeReads-0xq: Build dashboard home and polish UI

- Split dashboard into two routes: `/dashboard` (home) and `/dashboard/search` (search)
- Dashboard home shows: welcome greeting, 3 quick action cards, recent analyses list, kids overview
- Added `listRecent` query to `convex/analyses.ts` — fetches recent analyses with book data (newest first, configurable count)
- Recent analyses show book cover thumbnail, title, author, verdict badge (color-coded), and link to book detail
- Kids overview shows avatar initial, name, age, links to wishlist — empty state prompts adding kids
- Quick action cards link to search page (Search, Scan Barcode, Snap Cover)
- Loading skeleton for analyses, empty states for both sections
- Updated Navbar: added "Home" link to `/dashboard`, "Search" now points to `/dashboard/search`
- No new dependencies
- Build + lint pass clean
- Files: `convex/analyses.ts` (modified), `src/app/dashboard/page.tsx` (rewritten), `src/app/dashboard/search/page.tsx` (new), `src/components/Navbar.tsx` (modified)

### Iteration 21 — SafeReads-tpl.4: Build onboarding flow for new users

- Added `onboardingComplete: v.optional(v.boolean())` to users schema
- Added `completeOnboarding` mutation to `convex/users.ts`
- Created `/onboarding` route with 3-step flow:
  - Step 0: Welcome screen explaining SafeReads
  - Step 1: Optional kid setup (reuses KidForm component) — collects names/ages locally, bulk-creates on completion
  - Step 2: Done screen with CTA to start searching
  - Skipped sensitivity profile step — analyses are now objective (not profile-dependent)
- Updated `src/app/dashboard/layout.tsx`
- Returning users (onboardingComplete=true) go straight to dashboard
- Build + lint pass clean

### Iteration 20 — SafeReads-90b: Rewrite AI prompt and analyses backend for objective content review

- Removed `profileHash` from analyses schema — analyses now keyed by `bookId` only (one per book)
- Rewrote `convex/analyses.ts` — profile-independent analysis
- Deleted `convex/lib/profileHash.ts`
- Updated VerdictSection.tsx — no longer needs profile lookup
- Build + lint pass clean

### Iteration 19 — SafeReads-tpl.3: Landing page for unauthenticated visitors

- Built full marketing landing page at `/` (root route)
- Signed-in redirect to `/dashboard`
- Mobile-first responsive design with bookish theme
- Build + lint pass clean

### Iteration 18 — SafeReads-xza: Mobile-first scan UX

- Redesigned dashboard search controls for mobile-first layout
- Scanner modals now use bottom-sheet pattern on mobile
- SearchBar placeholder shortened for mobile
- Build + lint pass clean

### Iteration 17 — SafeReads-w1e: Book cover photo identification via vision AI

- Created `convex/books.ts:identifyCover` action — OpenAI GPT-4o vision for book identification
- Created `src/components/CoverScanner.tsx` — camera capture component
- Updated `src/app/dashboard/page.tsx` — added CoverScanner next to BarcodeScanner
- Build + lint pass clean

### Iteration 16 — SafeReads-tpl.7: Research: Replace sensitivity sliders with objective content review

- Recommendation: switch to objective content review (one analysis per book)
- No code changes — research only
- Next steps: implement migration plan in follow-up issues

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
