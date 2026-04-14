# FIXES — Keith Cobb Interactive Storybook

> Bug and issue tracker. Updated each nightshift run.

## Statuses
- `found` — Issue identified, no plan yet
- `planned` — Fix plan written (see plan file path)
- `resolved` — Fix confirmed in codebase (check git log)

---

## Open Issues

### [FIX-008] submitDraft Ignores User Edits to Title/Body
- **Status:** planned
- **Severity:** High — user edits are silently discarded; contributor never knows
- **Found:** 2026-04-14
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-008-submit-draft-ignores-edits.md`
- **Summary:** `submitDraft()` in `tell/page.tsx` sets `submitted: true` but never sends the edited `editTitle`/`editBody` back to Supabase. A new PATCH endpoint (`/api/tell/draft/update`) is needed, plus wiring in `submitDraft()`.

---

### [FIX-009] No Rate Limiting on /api/tell/draft + Raw Response Leak
- **Status:** planned
- **Severity:** Medium — financial risk (4096 token Claude call, unguarded); minor privacy issue
- **Found:** 2026-04-14
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-009-tell-draft-rate-limiting.md`
- **Summary:** `/api/tell/draft` calls Claude with max_tokens 4096 and has no `checkRateLimit()`. Also: on JSON parse failure, returns `{ raw: rawText }` which leaks Claude's response in an API error.

---

### [FIX-010] getWikiSummaries() in parser.ts Has No Cache
- **Status:** planned
- **Severity:** Low-Medium — disk read on every /api/tell request; immutable file at runtime
- **Found:** 2026-04-14
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-010-tell-prompts-wiki-cache.md`
- **Summary:** `parser.ts`'s exported `getWikiSummaries()` reads `index.md` from disk each call. `tell-prompts.ts` calls it on every chat message. The Ask system already caches this in `prompts.ts`; the Tell system bypasses that cache.

---

### [FIX-011] Dead `generateStaticParams` in Journey Routes
- **Status:** planned
- **Severity:** Low — dead code, same issue as FIX-006 (resolved for stories/themes but reintroduced for journeys)
- **Found:** 2026-04-14
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-011-dead-generatestaticparams-journeys.md`
- **Summary:** `journeys/[slug]/page.tsx` and `journeys/[slug]/[step]/page.tsx` both export `generateStaticParams`. Because the auth layout reads cookies, all routes render dynamically — these exports are ignored by Next.js 16.

---

### [FIX-012] Unused `_node` Lint Warning in Ask Page
- **Status:** planned
- **Severity:** Very Low — 1 ESLint warning, no runtime impact
- **Found:** 2026-04-14
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-012-unused-node-lint-warning.md`
- **Summary:** `ask/page.tsx` line 10: `node: _node` in the markdown `a` component produces `'_node' is defined but never used`. Rename to `node: _` or add eslint-disable-next-line.

---

## Resolved Issues

### [FIX-001] Next.js 16 Middleware Deprecation
- **Status:** resolved
- **Severity:** Medium — build warning today, will eventually break
- **Found:** 2026-04-12
- **Resolved:** 2026-04-13
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-001-middleware-to-proxy.md`
- **Summary:** Replaced `src/middleware.ts` with `src/proxy.ts` using `export async function proxy` (Next.js 16 requires the function name `proxy`, not `middleware`). Build no longer emits the deprecation warning.

---

### [FIX-002] Lint Errors in scripts/compile-wiki.ts
- **Status:** resolved
- **Severity:** Low — breaks clean lint, will block CI
- **Found:** 2026-04-12
- **Resolved:** 2026-04-13
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-002-compile-wiki-lint-errors.md`
- **Summary:** Added `ParsedStory`, typed manifest rows as `Record<string, string>` → `ManifestRow`, removed unused `getLifeStage`, `LIFE_STAGE_ORDER`, and `quotesData` load.

---

### [FIX-003] Story Full Text Loses Markdown Formatting
- **Status:** resolved
- **Severity:** Low-Medium — UX quality, no data loss
- **Found:** 2026-04-12
- **Resolved:** 2026-04-13
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-003-story-fulltext-markdown.md`
- **Summary:** `src/app/stories/[storyId]/page.tsx` now renders `fullText` with `ReactMarkdown` inside the existing prose article.

---

### [FIX-004] No Rate Limiting on /api/ask
- **Status:** resolved
- **Severity:** Medium — financial risk, no cost guard on Claude API
- **Found:** 2026-04-12
- **Resolved:** 2026-04-13
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-004-ask-api-rate-limiting.md`
- **Summary:** Added `src/lib/rate-limit.ts` (20 req/min per user). `/api/ask` returns 429 with `Retry-After`; Ask page shows a friendly message for 429.

---

### [FIX-005] Orphaned User Messages on Stream Failure
- **Status:** resolved
- **Severity:** Low — invisible today, will surface when conversation resumption is built
- **Found:** 2026-04-12
- **Resolved:** 2026-04-13
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-005-orphaned-user-messages.md`
- **Summary:** User message insert uses `.select("id").single()`; on stream `catch`, if `fullResponse` is still empty, the row is deleted by `id`.

---

### [FIX-006] Dead `generateStaticParams` in Story/Theme Detail Pages
- **Status:** resolved
- **Severity:** Low — dead code at build time, no runtime impact
- **Found:** 2026-04-13
- **Resolved:** 2026-04-13
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-006-dead-generatestaticparams.md`
- **Summary:** Removed `generateStaticParams` and unused `getAllStories` / `getAllThemes` imports from story and theme detail pages.

---

### [FIX-007] SSE Stream Chunk Parsing Fragility in Ask Page
- **Status:** resolved
- **Severity:** Medium — causes intermittent chat failures on slow/mobile connections
- **Found:** 2026-04-13
- **Resolved:** 2026-04-13
- **Plan:** `docs/nightshift/plans/FIXPLAN-FIX-007-sse-chunk-fragility.md`
- **Summary:** Ask page stream reader uses a line buffer, `TextDecoder` `{ stream: true }`, final `decode()` flush on `done`, and per-line try/catch.

---
