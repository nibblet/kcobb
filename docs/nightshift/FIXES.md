# FIXES — Keith Cobb Interactive Storybook

> Bug and issue tracker. Updated each nightshift run.

## Statuses
- `found` — Issue identified, no plan yet
- `planned` — Fix plan written (see plan file path)
- `resolved` — Fix confirmed in codebase (check git log)

---

## Open Issues

### [FIX-001] Next.js 16 Middleware Deprecation
- **Status:** planned
- **Severity:** Medium — build warning today, will eventually break
- **Found:** 2026-04-12
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-001-middleware-to-proxy.md`
- **Summary:** `src/middleware.ts` uses the deprecated Next.js 16 `middleware` file convention. Must be renamed to `src/proxy.ts`. Build currently warns on every run: "The 'middleware' file convention is deprecated."

---

### [FIX-002] Lint Errors in scripts/compile-wiki.ts
- **Status:** planned
- **Severity:** Low — breaks clean lint, will block CI
- **Found:** 2026-04-12
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-002-compile-wiki-lint-errors.md`
- **Summary:** `npm run lint` returns 2 errors (`any` type on lines 98 and 196) and 3 warnings (unused vars: `getLifeStage`, `LIFE_STAGE_ORDER`, `quotesData`) in the compile-wiki script.

---

### [FIX-003] Story Full Text Loses Markdown Formatting
- **Status:** planned
- **Severity:** Low-Medium — UX quality, no data loss
- **Found:** 2026-04-12
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-003-story-fulltext-markdown.md`
- **Summary:** Story detail page splits `fullText` on `\n` and wraps lines in `<p>` tags, stripping all markdown formatting (bold, italic, blockquotes, lists). Should use `ReactMarkdown` like the Ask page already does.

---

### [FIX-004] No Rate Limiting on /api/ask
- **Status:** planned
- **Severity:** Medium — financial risk, no cost guard on Claude API
- **Found:** 2026-04-12
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-004-ask-api-rate-limiting.md`
- **Summary:** `/api/ask` has auth but no rate limiting. Any authenticated user can make unlimited Claude API calls. Fix: in-memory sliding-window limiter (20 req/min per user) with graceful 429 handling in the UI.

---

### [FIX-005] Orphaned User Messages on Stream Failure
- **Status:** planned
- **Severity:** Low — invisible today, will surface when conversation resumption is built
- **Found:** 2026-04-12
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-005-orphaned-user-messages.md`
- **Summary:** User message is saved to DB before Claude stream starts. If stream fails, user message persists with no assistant response, leaving a dangling turn in conversation history. Fix: capture message ID on insert, delete it in the stream's catch block if no response was generated.

---

---

### [FIX-006] Dead `generateStaticParams` in Story/Theme Detail Pages
- **Status:** planned
- **Severity:** Low — dead code at build time, no runtime impact
- **Found:** 2026-04-13
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-006-dead-generatestaticparams.md`
- **Summary:** Both `/stories/[storyId]` and `/themes/[slug]` define `generateStaticParams` but render as Dynamic (ƒ) because the root layout reads cookies (Supabase SSR auth). In Next.js 16 App Router, any layout that reads cookies forces all children to be dynamic, making `generateStaticParams` a no-op. For an auth-gated app this is actually correct behavior, but the unused exports add noise and build time. Fix: remove `generateStaticParams` from both pages and clean up the now-unused `getAllStories` / `getAllThemes` imports.

---

### [FIX-007] SSE Stream Chunk Parsing Fragility in Ask Page
- **Status:** planned
- **Severity:** Medium — causes intermittent chat failures on slow/mobile connections
- **Found:** 2026-04-13
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-007-sse-chunk-fragility.md`
- **Summary:** `src/app/ask/page.tsx` splits incoming stream chunks on `\n` and JSON-parses each `data:` line without buffering. TCP packets can split an SSE line mid-way, causing `JSON.parse()` to throw a `SyntaxError`. This error propagates to the outer catch block, which removes the assistant placeholder and shows a generic error — even if Claude was mid-response. Fix: accumulate a text buffer across chunks, only parse complete lines (those followed by `\n`), and wrap each line parse in a try/catch so a single bad line doesn't abort the whole stream.

---

## Resolved Issues

*(None yet)*
