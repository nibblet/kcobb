# BACKLOG — Keith Cobb Interactive Storybook

> Ideas backlog with maturity tracking. Two categories: enhance existing features, and new features.

## Maturity Levels
- `seed` — 1-2 sentence concept, just identified
- `exploring` — Validated against codebase, feasibility assessed
- `planned` — User stories, technical approach defined
- `ready` — Dev plan written, waiting for Paul to execute
- `parked` — Stale 3+ days or deprioritized
- `shipped` — Implemented and in production

---

## Category 1: Enhance / Mature / Expand Existing Features

### [IDEA-001] Guided Journeys — Curated Paths Through Stories
- **Status:** shipped
- **Category:** enhance
- **Seeded:** 2026-04-12
- **Last Updated:** 2026-04-14
- **Priority:** P1
- **Plan:** `docs/nightshift/plans/DEVPLAN-IDEA-001-guided-journeys.md`
- **Summary:** Curated, themed paths through the 39 stories with reflection prompts and progress tracking via localStorage.
- **Night Notes:**
  - 2026-04-12: Seeded by Paul. Nightshift wrote the dev plan.
  - 2026-04-14: **SHIPPED.** Four journeys live at `/journeys`. Full UI including progress bar, reflection prompts, completion page.

---

### [IDEA-003] Age-Aware Ask Keith Suggestion Chips
- **Status:** parked
- **Category:** enhance
- **Seeded:** 2026-04-12
- **Last Updated:** 2026-04-15
- **Priority:** P2
- **Plan:** `docs/nightshift/plans/DEVPLAN-IDEA-003-age-aware-suggestion-chips.md`
- **Summary:** The 4 suggestion chips on the Ask Keith empty state are hardcoded for adult readers. They should dynamically reflect the active age mode.
- **Night Notes:**
  - 2026-04-12: Seeded. `useAgeMode()` hook already imported.
  - 2026-04-13: Advanced to `ready`. Dev plan written.
  - 2026-04-15: **Stale 3 days — parked.** Plan still valid if revisited (20-min change).

---

### [IDEA-007] Resume Tell Session — Continue an In-Progress Story
- **Status:** shipped
- **Category:** enhance
- **Seeded:** 2026-04-14
- **Last Updated:** 2026-04-15
- **Priority:** P2
- **Plan:** `docs/nightshift/plans/DEVPLAN-IDEA-007-resume-tell-session.md`
- **Summary:** "Continue your story" banner on Tell/Beyond pages. Detects in-progress sessions and lets contributors resume mid-conversation.
- **Night Notes:**
  - 2026-04-14: Seeded and advanced to `ready` same night.
  - 2026-04-15: **SHIPPED.** `GET /api/tell/sessions` + `GET /api/tell/sessions/[id]`. Implemented in `StoryContributionWorkspace.tsx`. Works for both tell and beyond modes.

---

### [IDEA-009] Story Voice Playback — Audio Narration
- **Status:** shipped
- **Category:** enhance
- **Seeded:** 2026-04-14
- **Last Updated:** 2026-04-16
- **Priority:** P1
- **Plan:** *(no dev plan written — Paul implemented directly)*
- **Summary:** Web Speech API TTS on all story pages. Play/Pause/Stop controls, estimated listen time from wordCount. No server cost, no audio files.
- **Night Notes:**
  - 2026-04-14: Seeded by Paul.
  - 2026-04-16: **SHIPPED.** `StoryAudioControls.tsx` + `src/lib/story-audio.ts` confirmed in codebase. Accessible, aria-live status, `useSyncExternalStore` for SSR safety.

---

### [IDEA-013] Story Reading Progress — Track the Journey Through 39 Stories
- **Status:** shipped
- **Category:** enhance
- **Seeded:** 2026-04-15
- **Last Updated:** 2026-04-17
- **Priority:** P2
- **Plan:** `docs/nightshift/plans/DEVPLAN-IDEA-013-story-reading-progress.md` *(infra portion)*
- **Summary:** Track which of Keith's 39 stories each family member has read. Show progress on profile and read badges on story cards.
- **Night Notes:**
  - 2026-04-15: Seeded and advanced to `planned` same night.
  - 2026-04-16: **Infra SHIPPED** (migration `005_story_reads.sql`, `ReadTracker` on story pages, `/api/stories/[storyId]/read`, Keith analytics dashboard). UI elements (profile progress bar + story card badges) remain. See IDEA-014 for UI plan.
  - 2026-04-17: **Profile reading dashboard SHIPPED** — `ProfileReadingDashboard.tsx` shows read count, most-recent date, top themes, top principles on `/profile`. Story card read badges still pending (see IDEA-014). Marking this shipped; IDEA-014 handles the remaining badge work.

---

### [IDEA-014] Story Read Progress UI — Story Card Read Badges
- **Status:** ready
- **Category:** enhance
- **Seeded:** 2026-04-16
- **Last Updated:** 2026-04-17
- **Priority:** P2
- **Plan:** `docs/nightshift/plans/DEVPLAN-IDEA-014-story-read-progress-ui.md`
- **Summary:** The profile reading dashboard (count, themes, principles) shipped in Run 6. The remaining piece: small "Read" badges on story cards in the story library, so family members can spot which stories they've already visited without clicking each one.
- **Night Notes:**
  - 2026-04-16: Seeded and advanced to `ready` same night. DB + API + ReadTracker all confirmed working. Only UI elements remain. Plan written.
  - 2026-04-17: **Profile progress dashboard portion SHIPPED** (ProfileReadingDashboard on `/profile`). Story card badges (Phase 2 of the plan) remain. Plan still valid — only Phase 2 needs execution now. Estimated ~45 min remaining work.

---

## Category 2: New Features or Integrations

### [IDEA-002] Keith's Story Workshop — Author & Source Material Intake
- **Status:** planned
- **Category:** new
- **Seeded:** 2026-04-12
- **Last Updated:** 2026-04-14
- **Priority:** P1
- **Plan:** *(full dev plan not yet written)*
- **Summary:** Track 1 (family /tell) and Beyond (Keith's AI-assisted workspace) are shipped. Track 2 (direct markdown authoring by Keith/admin) remains.
- **Night Notes:**
  - 2026-04-12: Seeded by Paul.
  - 2026-04-14: Track 1 SHIPPED as `/tell`. Advanced to `planned`.
  - 2026-04-16: Beyond workspace SHIPPED — Keith can now capture stories via AI-assisted chat AND respond to reader questions. Remaining: admin-facing direct markdown editor for quick story additions without chat.

---

### [IDEA-004] Bookmark a Story as a Favorite
- **Status:** shipped
- **Category:** new
- **Seeded:** 2026-04-12
- **Last Updated:** 2026-04-17
- **Priority:** P1
- **Plan:** `docs/nightshift/plans/DEVPLAN-IDEA-004-story-favorites.md`
- **Summary:** Heart icon on every story detail page. Favorited stories collected at `/profile/favorites`, linked from ProfileHero. `sb_story_favorites` table (migration 011), optimistic toggle, clean empty state. Pairs with IDEA-016 (passage highlights) — both surface on the profile page.
- **Night Notes:**
  - 2026-04-12: Seeded by Nightshift.
  - 2026-04-15: Parked — superseded by IDEA-013.
  - 2026-04-16: **Unparked and advanced to `ready`** — Paul explicitly requested. Full dev plan written. Estimated 1.5–2 hours.
  - 2026-04-17: **SHIPPED.** `FavoriteButton.tsx`, migration 011, `/api/stories/[storyId]/favorite`, `/api/profile/favorites`, `/profile/favorites/page.tsx`, ProfileHero link all confirmed in commit `d8af9cc`.

---

### [IDEA-008] "New Stories" Feed on Home Page
- **Status:** parked
- **Category:** new
- **Seeded:** 2026-04-14
- **Last Updated:** 2026-04-17
- **Priority:** P2
- **Plan:** *(not yet written)*
- **Summary:** Home page section showing most recent family-contributed stories (from `getPublishedStories()`). Pairs naturally with IDEA-006.
- **Night Notes:**
  - 2026-04-14: Seeded. `getPublishedStories()` already exists. Pure UI addition, no DB changes.
  - 2026-04-17: Stale 3 days — likely low priority while Paul is shipping bigger features. Demoting to parked. Easy to revisit (no DB changes, pure UI).

---

### [IDEA-010] Public Media Integration — Podcasts, Videos, and Public Sources
- **Status:** parked
- **Category:** new
- **Seeded:** 2026-04-14
- **Last Updated:** 2026-04-17
- **Priority:** P2
- **Plan:** *(not yet written)*
- **Summary:** Curated "Keith in the World" section — podcasts, YouTube interviews, press coverage. Wiki-curated via `content/wiki/media/` files. No backend.
- **Night Notes:**
  - 2026-04-14: Seeded by Paul.
  - 2026-04-17: Stale 3 days — content curation is the blocker (need actual media links), not the code. Demoting to parked. Revisit when Paul has a media list to work from.

---

### [IDEA-011] Story Photos — Images That Surface During Reading
- **Status:** shipped
- **Category:** enhance
- **Seeded:** 2026-04-14
- **Last Updated:** 2026-04-17
- **Priority:** P1
- **Plan:** *(no dev plan written — Paul implemented directly)*
- **Summary:** Associate photos with specific stories via inline markdown syntax. Images render inline as the reader scrolls, with a click-to-expand lightbox. Especially powerful in young_reader mode.
- **Night Notes:**
  - 2026-04-14: Seeded by Paul. Timeline already has 14 photos in `public/timeline/`.
  - 2026-04-17: **SHIPPED.** Commit `c7ebef7` added 35 original book images to `public/book-images/`, updated 17 story wiki files with inline `![...]` image references, and created `StoryMarkdown.tsx` (ReactMarkdown-based renderer with click-to-expand lightbox, "Fit to Screen" / "Actual Size" / "Open Original" controls, keyboard Escape support).

---

### [IDEA-012] Letter to Keith — Personal Takeaway from an Ask Conversation
- **Status:** seed
- **Category:** new
- **Seeded:** 2026-04-15
- **Last Updated:** 2026-04-15
- **Priority:** P2
- **Plan:** *(not yet written)*
- **Summary:** After an Ask conversation, generate a short personal letter (from the user's perspective) summarizing what they learned. Downloadable. Especially meaningful for grandchildren.
- **Night Notes:**
  - 2026-04-15: Seeded. Non-streaming `/api/ask/letter` endpoint reusing conversation messages state.

---

### [IDEA-016] Save a Passage — Highlight Text from Stories
- **Status:** shipped
- **Category:** new
- **Seeded:** 2026-04-16
- **Last Updated:** 2026-04-17
- **Priority:** P1
- **Plan:** `docs/nightshift/plans/DEVPLAN-IDEA-016-passage-highlights.md`
- **Summary:** Select any text in a story body → floating "Save this passage" button appears → one click saves it to Supabase. All saved passages collected at `/profile/highlights`, grouped by story in a reading-journal layout with blockquote styling. Individual passages can be removed. `sb_story_highlights` table (migration 012). Pairs with IDEA-004 (favorites) — both accessible from the profile page.
- **Night Notes:**
  - 2026-04-16: Seeded and advanced to `ready` same session (Paul explicitly requested). Full dev plan written.
  - 2026-04-17: **SHIPPED.** `StoryBodyWithHighlighting.tsx`, migration 012, all API routes, `/profile/highlights/page.tsx`, `DeleteHighlightButton.tsx`, ProfileHero "✎ My passages" link all confirmed in commit `5dd3116`.

---

### [IDEA-017] Original Photos Gallery — Browse the Memoir's Images
- **Status:** ready
- **Category:** new
- **Seeded:** 2026-04-17
- **Last Updated:** 2026-04-17
- **Priority:** P2
- **Plan:** `docs/nightshift/plans/DEVPLAN-IDEA-017-photo-gallery.md`
- **Summary:** A dedicated `/gallery` page that lets family members browse all 35 original memoir photos grouped by life era, each with a click-to-enlarge lightbox and a link to the story it came from. Builds on `StoryMarkdown.tsx`'s lightbox and the `public/book-images/` assets already in place.
- **Night Notes:**
  - 2026-04-17: Seeded and advanced to `ready` same night. 35 book images confirmed in `public/book-images/`. Lightbox component already exists in `StoryMarkdown.tsx`. Plan calls for extracting a reusable `PhotoLightbox` component + new `gallery-photos.ts` static data + `/gallery` page. Estimated 2–2.5 hours.

---

### [IDEA-018] Ask Keith About a Saved Passage
- **Status:** ready
- **Category:** new
- **Seeded:** 2026-04-17
- **Last Updated:** 2026-04-17
- **Priority:** P1
- **Plan:** `docs/nightshift/plans/DEVPLAN-IDEA-018-ask-from-passage.md`
- **Summary:** "Ask Keith about this →" button on each saved passage in `/profile/highlights`. Clicking it opens the Ask Keith chat with the saved passage pre-loaded as context, so the AI responds specifically to that quote. Transforms saved passages from a static archive into live conversation starters.
- **Night Notes:**
  - 2026-04-17: Seeded and advanced to `ready` same night. Both IDEA-016 (highlights) and Ask are shipped. This is a pure integration — URL query param on `/ask` + `useEffect` on mount + button in highlights page. Estimated 1 hour. Strong storytelling value for grandchildren.

---

### [IDEA-015] Enable Deep Ask — Multi-Perspective Responses in Production
- **Status:** ready
- **Category:** new
- **Seeded:** 2026-04-16
- **Last Updated:** 2026-04-16
- **Priority:** P2
- **Plan:** `docs/nightshift/plans/DEVPLAN-IDEA-015-deep-ask-activation.md`
- **Summary:** The multi-perspective Ask orchestrator (storyteller + principles coach → synthesizer) is fully implemented and feature-flagged via `ENABLE_DEEP_ASK=true`. The classifier now defaults to "deep" for all reflective questions. Activating it requires reviewing the perspective prompts in `perspectives.ts`, testing locally, then setting the env var in Vercel. Estimated 30 min eval + 5 min deploy.
- **Night Notes:**
  - 2026-04-16: Seeded and advanced to `ready` same night. `orchestrator.ts`, `classifier.ts`, `perspectives.ts` all confirmed in codebase. Plan written.

---

## Parked

*(Ideas demoted after 3+ days without action — full entries remain in category sections above with status: parked)*

- **IDEA-003** Age-Aware Suggestion Chips — parked 2026-04-15. Plan at `DEVPLAN-IDEA-003-age-aware-suggestion-chips.md`.
- *(IDEA-004 unparked 2026-04-16 — SHIPPED 2026-04-17)*
- **IDEA-005** Reading Time Estimate — parked 2026-04-16. Stale 3 days. `wordCount` exists but Paul has not prioritized. Parked — easy to revisit (30 min, no deps).
- **IDEA-006** Featured Story of the Week — parked 2026-04-16. Stale 3 days. Wiki-first, no DB changes. Parked — revisit when home page refresh is prioritized.
- **IDEA-008** New Stories Feed — parked 2026-04-17. Stale 3 days. Pure UI addition. Parked — low priority while larger features are landing.
- **IDEA-010** Public Media Integration — parked 2026-04-17. Stale 3 days. Content curation is the blocker (need actual media links). Parked — revisit when Paul has a media list.
