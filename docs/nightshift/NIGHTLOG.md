# NIGHTLOG — Keith Cobb Interactive Storybook

> Append-only history of every nightly run. Most recent at the top.

---

## Run: 2026-04-14 (Run 3)

### Summary
- Scanned: new `/tell` feature (tell/page.tsx, /api/tell, /api/tell/draft), /admin/drafts, supabase-stories.ts, migration 003, journeys routes, ask/page.tsx updates, build + lint
- Issues found: 5 new (FIX-008 through FIX-012) — all `found` → `planned` same night
- Issues resolved: 0 this run (7 total already resolved from prior runs)
- Ideas: IDEA-001 marked `shipped`, IDEA-002 advanced to `planned`, 2 new seeds (IDEA-007, IDEA-008), IDEA-007 immediately advanced to `ready`
- Plans written:
  - `FIXPLAN-FIX-008-submit-draft-ignores-edits.md`
  - `FIXPLAN-FIX-009-tell-draft-rate-limiting.md`
  - `FIXPLAN-FIX-010-tell-prompts-wiki-cache.md`
  - `FIXPLAN-FIX-011-dead-generatestaticparams-journeys.md`
  - `FIXPLAN-FIX-012-unused-node-lint-warning.md`
  - `DEVPLAN-IDEA-007-resume-tell-session.md`

### Build & Lint Results
- `npm run build`: **PASSES** — clean, no warnings. All 25 routes render as ƒ (Dynamic). New routes: `/tell`, `/admin/drafts`, `/api/tell`, `/api/tell/draft`.
- `npm run lint`: **1 warning** (not an error) — `_node` unused in `ask/page.tsx:10`. No errors.

### Key Findings

1. **IDEA-001 (Guided Journeys) SHIPPED** — Paul implemented the full journeys feature as part of the `3d56213` + `85356d4` commits. Four journeys live at `/journeys`. Routes include intro, step-by-step reader with reflection prompts, journey connectors, and completion page. Progress tracked via localStorage. This was the P1 backlog item.

2. **IDEA-002 (Story Workshop) Track 1 SHIPPED as `/tell`** — The `cad049d` commit implements a full story contribution pipeline: AI interviewer chat → draft composition → admin review → publish. Family members can tell stories at `/tell`; Paul reviews and publishes at `/admin/drafts`. Story IDs generalized to `P{n}_S{nn}` for multi-volume support.

3. **FIX-008 (HIGH): submitDraft ignores user edits** — `tell/page.tsx` `submitDraft()` just sets `submitted: true` without persisting `editTitle`/`editBody` back to Supabase. Users can edit the AI-composed draft but those edits are silently lost. A PATCH endpoint + 5-line change in `submitDraft()` fixes this.

4. **FIX-009 (MEDIUM): /api/tell/draft has no rate limit** — This is the most expensive Claude call in the app (4096 tokens). Unlike `/api/tell` (20/min) and `/api/ask` (20/min), the draft endpoint is unguarded. Also: on parse error, returns `{ raw: rawText }` leaking Claude's response.

5. **FIX-010: getWikiSummaries() reads disk on every /api/tell call** — `parser.ts` exports an uncached `getWikiSummaries()`. `tell-prompts.ts` calls it on every chat turn. The Ask system already caches this. One-line fix in `tell-prompts.ts`.

6. **FIX-011: Dead generateStaticParams reintroduced in journeys** — Same issue as FIX-006 (resolved for stories/themes) but the journey routes export it again. Both `journeys/[slug]/page.tsx` and `journeys/[slug]/[step]/page.tsx` affected. Dead code, 5-min cleanup.

7. **Ask page significantly improved** — `ask/page.tsx` now has: `sendInFlightRef` for double-submit prevention, `useCallback` memoization, `journeySlug` awareness in prompt, batch SSE text accumulation (immutable updater for React Strict Mode), and markdown hyperlinks to story pages.

### Plans Ready to Execute
- `docs/nightshift/plans/FIXPLAN-FIX-008-submit-draft-ignores-edits.md` — Save user edits on Tell draft submission (30 min, HIGH priority)
- `docs/nightshift/plans/FIXPLAN-FIX-009-tell-draft-rate-limiting.md` — Rate limit /api/tell/draft, remove raw leak (15 min)
- `docs/nightshift/plans/DEVPLAN-IDEA-003-age-aware-suggestion-chips.md` — Age-aware chips in Ask (20 min, no deps)
- `docs/nightshift/plans/DEVPLAN-IDEA-007-resume-tell-session.md` — Resume in-progress Tell sessions (1.5-2 hrs)
- `docs/nightshift/plans/FIXPLAN-FIX-010-tell-prompts-wiki-cache.md` — Cache wiki summaries in tell-prompts (10 min)
- `docs/nightshift/plans/FIXPLAN-FIX-011-dead-generatestaticparams-journeys.md` — Remove dead params from journeys (5 min)

### Recommendations
- **If you have 30 min:** FIX-008 + FIX-009 back-to-back. FIX-008 prevents data loss (user edits disappear), FIX-009 is a financial safety fix. Both are small, targeted changes.
- **If you have 2 hours:** The 30-min batch above, then IDEA-003 (age chips, 20 min) and IDEA-007 (resume Tell session, 1.5 hrs). After this batch: the Tell pipeline is production-quality and the Ask experience is fully age-aware.

---

## Run: 2026-04-13 (Run 2)

### Summary
- Scanned: all routes, hooks, API handlers, AI prompts, build output, lint results
- Issues found: 2 new (`found` → `planned` same night), 5 existing (all still open, no code commits since Run 1), 0 resolved
- Ideas: 2 new seeds (IDEA-005, IDEA-006), 1 promoted (IDEA-003: seed → ready), all others holding
- Plans written:
  - `FIXPLAN-FIX-006-dead-generatestaticparams.md`
  - `FIXPLAN-FIX-007-sse-chunk-fragility.md`
  - `DEVPLAN-IDEA-003-age-aware-suggestion-chips.md`

### Build & Lint Results
- `npm run build`: **PASSES** — 1 deprecation warning (FIX-001 still open: middleware → proxy). All routes Dynamic (ƒ). Build took ~17 min.
- `npm run lint`: **FAILS** — same 2 errors, 3 warnings in `scripts/compile-wiki.ts` (FIX-002 still open). No new lint errors.

### Key Findings
1. **No code changes since Run 1** — All 5 fixes from last night are still open. Paul hasn't had a session yet. Plans are queued and ready.
2. **SSE stream parsing fragility** (FIX-007, new) — `ask/page.tsx` splits stream chunks on `\n` without buffering. TCP packet boundaries can split SSE lines, causing `JSON.parse()` to throw and killing the stream mid-response. Fix: accumulate a buffer across chunks, parse only complete lines, per-line try/catch. Plan written.
3. **Dead `generateStaticParams`** (FIX-006, new) — Story/theme detail pages define `generateStaticParams` but render dynamically due to the auth layout reading cookies. The exports are dead code. Low severity — app works correctly — but they add noise and a few extra seconds to the build. Plan written (5-min fix).
4. **Suggestion chips confirmed hardcoded** — Verified in `ask/page.tsx` lines 143-148. The `useAgeMode()` hook IS imported, `ageMode` IS available. The fix is exactly as IDEA-003 described. Advanced to `ready`, dev plan written (20-min change).
5. **AI prompt is solid** — `buildSystemPrompt` in `src/lib/ai/prompts.ts` is well-constructed. Voice guide, wiki index, story context, and age mode instructions are all assembled cleanly. File caching (`cachedWikiSummaries`, `cachedVoiceGuide`) prevents repeated disk reads. No issues.

### Plans Ready to Execute
- `docs/nightshift/plans/FIXPLAN-FIX-001-middleware-to-proxy.md` — Rename middleware.ts → proxy.ts (5 min)
- `docs/nightshift/plans/FIXPLAN-FIX-003-story-fulltext-markdown.md` — Use ReactMarkdown for story text (10 min)
- `docs/nightshift/plans/DEVPLAN-IDEA-003-age-aware-suggestion-chips.md` — Age-aware suggestion chips in Ask (20 min, no deps)
- `docs/nightshift/plans/FIXPLAN-FIX-007-sse-chunk-fragility.md` — Robust SSE stream parsing (30 min)
- `docs/nightshift/plans/FIXPLAN-FIX-004-ask-api-rate-limiting.md` — Per-user rate limiting on /api/ask (30 min)
- `docs/nightshift/plans/DEVPLAN-IDEA-001-guided-journeys.md` — Full Guided Journeys feature (4–6 hours, do FIX-003 first)

### Recommendations
- **If you have 30 min:** FIX-001 + FIX-003 + IDEA-003 — eliminate the build warning, fix markdown rendering, and make suggestion chips age-aware. Three separate plan files, all self-contained, can be done back-to-back.
- **If you have 2 hours:** The 30-min batch above, then FIX-007 (SSE buffering) and FIX-004 (rate limiting). Clears the medium-severity backlog entirely.

---

## Run: 2026-04-12 (Run 1 — First Full Scan)

### Summary
- Scanned: all 31 source files (routes, components, hooks, lib, scripts, migration, wiki content)
- Issues found: 5 new (`found` → `planned` same night), 0 existing, 0 resolved
- Ideas: 2 new seeds (IDEA-003, IDEA-004), 1 promoted (IDEA-001: seed → ready), 1 advanced (IDEA-002: seed → exploring)
- Plans written:
  - `FIXPLAN-FIX-001-middleware-to-proxy.md`
  - `FIXPLAN-FIX-002-compile-wiki-lint-errors.md`
  - `FIXPLAN-FIX-003-story-fulltext-markdown.md`
  - `FIXPLAN-FIX-004-ask-api-rate-limiting.md`
  - `FIXPLAN-FIX-005-orphaned-user-messages.md`
  - `DEVPLAN-IDEA-001-guided-journeys.md`

### Build & Lint Results
- `npm run build`: **PASSES** — 1 deprecation warning (FIX-001: middleware → proxy)
- `npm run lint`: **FAILS** — 2 errors, 3 warnings in `scripts/compile-wiki.ts` (FIX-002)
- All routes render as Dynamic (ƒ) — correct for auth-dependent app

### Key Findings
1. **Next.js 16 middleware deprecation** — `src/middleware.ts` needs to become `src/proxy.ts`. The build warns on every run. Easy 5-minute fix.
2. **Story full text missing markdown rendering** — `stories/[storyId]/page.tsx` splits text on newlines manually instead of using `ReactMarkdown`. The package is already installed and used in Ask. Quick fix with visible UX benefit.
3. **No rate limiting on /api/ask** — Any authenticated user can fire unlimited Claude API calls. In-memory sliding window limiter would cost <30min and prevent surprise bills.
4. **RLS is solid** — All three tables have proper policies. No auth gaps found. `sb_profiles.role` field exists for admin use but admin-gated routes don't exist yet.
5. **Age mode affects AI prompt only** — The system prompt adapts well by mode. But suggestion chips in Ask are hardcoded for adults, and story UI doesn't vary by mode at all. IDEA-003 addresses this.

### Plans Ready to Execute
- `docs/nightshift/plans/FIXPLAN-FIX-001-middleware-to-proxy.md` — Rename middleware.ts → proxy.ts (5 min)
- `docs/nightshift/plans/FIXPLAN-FIX-003-story-fulltext-markdown.md` — Use ReactMarkdown for story text (10 min)
- `docs/nightshift/plans/FIXPLAN-FIX-004-ask-api-rate-limiting.md` — Add per-user rate limit to /api/ask (30 min)
- `docs/nightshift/plans/DEVPLAN-IDEA-001-guided-journeys.md` — Full Guided Journeys feature (4–6 hours)

### Recommendations
- **If you have 15 min:** Do FIX-001 and FIX-003 back to back — eliminates the build warning and improves story rendering with minimal effort.
- **If you have 2 hours:** FIX-004 (rate limiting) + start Phase 1 of IDEA-001 (create journey content files and parser). Phase 1 is just markdown files and a TypeScript parser — no UI yet.

---

## Run: 2026-04-12 (Initial Setup)

### Summary
- Nightshift system initialized
- Baseline docs created: STATUS.md, BACKLOG.md, FIXES.md, NIGHTLOG.md
- Plans directory created at `docs/nightshift/plans/`
- Scheduled task configured for nightly 1:00 AM runs

### Recommendations
- **First real scan will run tonight at 1 AM**
