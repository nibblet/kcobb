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
  - 2026-04-14: **SHIPPED.** Implemented in commit `3d56213`. Routes live at `/journeys`, `/journeys/[slug]`, `/journeys/[slug]/[step]`, `/journeys/[slug]/complete`. Four journeys in `content/wiki/journeys/`. Full UI including progress bar, journey connector text, reflection prompts, and completion page.

---

### [IDEA-003] Age-Aware Ask Keith Suggestion Chips
- **Status:** ready
- **Category:** enhance
- **Seeded:** 2026-04-12
- **Last Updated:** 2026-04-13
- **Priority:** P2
- **Plan:** `docs/nightshift/plans/DEVPLAN-IDEA-003-age-aware-suggestion-chips.md`
- **Summary:** The 4 suggestion chips on the Ask Keith empty state are hardcoded for adult readers. They should dynamically reflect the active age mode — simpler, more relatable questions for young_reader and teen modes.
- **Night Notes:**
  - 2026-04-12: Seeded by Nightshift. `useAgeMode()` hook is already imported.
  - 2026-04-13: Advanced to `ready`. Dev plan written.
  - 2026-04-14: Still unimplemented (verified in `ask/page.tsx` lines 213–218). Plan remains valid. 20-minute change, no dependencies.

---

### [IDEA-005] Reading Time Estimate on Story Cards
- **Status:** seed
- **Category:** enhance
- **Seeded:** 2026-04-13
- **Last Updated:** 2026-04-13
- **Priority:** P3
- **Plan:** *(not yet written)*
- **Summary:** Show estimated reading time on story cards in the library and on the story detail header. The `wordCount` field already exists on `WikiStory` — just display `Math.ceil(wordCount / 200)` minutes.
- **Night Notes:**
  - 2026-04-13: Seeded by Nightshift. `wordCount` already populated. UI change only.

---

### [IDEA-007] Resume Tell Session — Continue an In-Progress Story
- **Status:** ready
- **Category:** enhance
- **Seeded:** 2026-04-14
- **Last Updated:** 2026-04-14
- **Priority:** P2
- **Plan:** `docs/nightshift/plans/DEVPLAN-IDEA-007-resume-tell-session.md`
- **Summary:** When a contributor navigates away from `/tell` mid-conversation, they lose their context. A "Continue your story" banner on the Tell page detects in-progress sessions and lets them pick up exactly where they left off.
- **Night Notes:**
  - 2026-04-14: Seeded and advanced to `ready` same night. Validated: `sb_story_sessions` table has `status` field; `gathering` sessions are resumable. Two new API routes needed (`GET /api/tell/sessions` and `GET /api/tell/sessions/[id]`). UI: resume banner in Tell empty state. Estimated 1.5–2 hours. No dependencies.

---

## Category 2: New Features or Integrations

### [IDEA-002] Keith's Story Workshop — Author & Source Material Intake
- **Status:** planned
- **Category:** new
- **Seeded:** 2026-04-12
- **Last Updated:** 2026-04-14
- **Priority:** P1
- **Plan:** *(full dev plan not yet written)*
- **Summary:** Two-track system for adding new stories. Track 1 (family contributions via `/tell`) is now implemented. Track 2 (direct markdown authoring by Keith/admin) and Track 3 (source material pipeline) remain.
- **Night Notes:**
  - 2026-04-12: Seeded by Paul. Track 1 explored as admin-only markdown editor.
  - 2026-04-12 (Nightshift): Advanced to `exploring`. `sb_profiles.role` supports admin gating.
  - 2026-04-14: **Track 1 (family contributions) SHIPPED** as `/tell` feature in commit `cad049d`. The `/tell` → `/admin/drafts` → publish pipeline is fully functional. Advancing to `planned`. What remains: (a) admin-facing direct markdown editor for Keith to write stories without going through chat, (b) V2 story management in admin (edit published Supabase stories). Track 2 (source material pipeline) is still a separate larger investment.

---

### [IDEA-004] Story Bookmarks — Save Favorites for Easy Return
- **Status:** seed
- **Category:** new
- **Seeded:** 2026-04-12
- **Last Updated:** 2026-04-12
- **Priority:** P2
- **Plan:** *(not yet written)*
- **Summary:** Let family members bookmark stories for re-reading. Bookmarks persist to Supabase so they're available across devices.
- **Night Notes:**
  - 2026-04-12: Seeded by Nightshift. New `sb_bookmarks` table, heart icon on story cards, "My Bookmarks" on home/profile.

---

### [IDEA-006] Featured Story of the Week on Home Page
- **Status:** seed
- **Category:** new
- **Seeded:** 2026-04-13
- **Last Updated:** 2026-04-13
- **Priority:** P2
- **Plan:** *(not yet written)*
- **Summary:** A highlighted "Story of the Week" card on the home page, curated by Paul from the 39 stories via a simple `content/wiki/featured.json` file.
- **Night Notes:**
  - 2026-04-13: Seeded by Nightshift. Zero DB changes needed, fully wiki-first.

---

### [IDEA-008] "New Stories" Feed on Home Page
- **Status:** seed
- **Category:** new
- **Seeded:** 2026-04-14
- **Last Updated:** 2026-04-14
- **Priority:** P2
- **Plan:** *(not yet written)*
- **Summary:** Now that family members can contribute stories via `/tell`, the home page should show a "Recently Added" section listing the newest published Supabase stories. This gives the family a sense that the archive is living and growing, and rewards contributors by making their stories visible immediately.
- **Night Notes:**
  - 2026-04-14: Seeded by Nightshift. Implementation: home page calls `getPublishedStories()` (already exists in `supabase-stories.ts`) and renders the most recent 3, sorted by Supabase `created_at`. No DB changes. Pure UI addition. Pairs naturally with IDEA-006 (featured story) — could combine into one "What's New" section.

---

## Parked

*(Ideas demoted after 3+ days without action)*
