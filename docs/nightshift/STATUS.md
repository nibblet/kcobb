# STATUS — Keith Cobb Interactive Storybook

> Last updated: 2026-04-17 (Nightshift Run 6)

## App Summary

**Keith Cobb Interactive Storybook** is a private, family-only digital archive built around 39 stories from Keith Cobb's life and leadership journey. Family members (especially grandchildren and great-grandchildren) can browse stories, explore principles/themes, view a life timeline, have AI-guided conversations ("Ask Keith"), follow curated Guided Journeys, contribute their own stories via the "Tell" feature, and write notes/questions directly to Keith from any story page.

**Domain:** stories.cobbcorner.com

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.3 (App Router), TypeScript 5 |
| Frontend | React 19, Tailwind CSS 4, @tailwindcss/typography |
| Content | Markdown wiki (`content/wiki/`) — pre-compiled, single source of truth |
| Database | Supabase (PostgreSQL) — auth + conversations + story contributions + Q&A |
| Auth | Supabase Auth (email-based, invite-only) |
| AI Chat | Claude Sonnet 4 (`claude-sonnet-4-20250514`) via Anthropic SDK 0.88.0 |
| Content Rendering | react-markdown (used in Ask, Tell, Story Detail, Journey Steps) |

## Architecture

### Wiki-First Content
- All Keith's stories (Volume 1) live in `content/wiki/` as markdown files
- Compiled from `content/raw/` via `scripts/compile-wiki.ts`
- Static data generated via `scripts/generate-static-data.ts` into `src/lib/wiki/static-data.ts`
- Family-contributed stories (Volume 2+) live in Supabase (`sb_story_drafts` with `status='published'`)
- Story detail page falls back from filesystem to Supabase for non-P1 story IDs

### Database (Supabase)
- **13 migrations** (up from 10 last run):
  - `001_initial_schema.sql` — base tables
  - `002_signup_profile_age.sql` — age + age_mode on profiles
  - `003_story_sessions.sql` — Tell sessions
  - `004_story_contribution_mode.sql` — beyond vs. tell contribution_mode
  - `005_keith_role.sql` + `005_story_reads.sql` — keith role + read tracking (dual 005 — apply both)
  - `006_chapter_questions.sql` — reader Q&A tables
  - `007_public_qna_read.sql` — RLS for public Q&A reads
  - `008_story_sessions_from_question.sql` — seed sessions from questions
  - `009_qna_rls_no_recursion.sql` — breaks RLS recursion in Q&A
  - `010_asker_seen.sql` — unread tracking for reader answers
  - `011_story_favorites.sql` — `sb_story_favorites` table (heart icon bookmarks)
  - `012_story_highlights.sql` — `sb_story_highlights` table (saved text passages)
  - `013_onboarding_flags.sql` — `has_onboarded` + `onboarded_at` on `sb_profiles`; existing users pre-seeded to true

- **Tables:**
  - `sb_profiles` — user profiles (display_name, age, age_mode, role: admin|member|keith, **has_onboarded**, **onboarded_at**)
  - `sb_conversations` + `sb_messages` — Ask Keith chat persistence
  - `sb_story_sessions` — Tell/Beyond: story-gathering chat sessions
  - `sb_story_messages` — Tell/Beyond: messages in a story-gathering session
  - `sb_story_drafts` — Tell/Beyond: AI-composed story drafts, publishable to library
  - `sb_story_reads` — Read tracking: which users have read which stories
  - `sb_chapter_questions` — Reader questions submitted from story pages (status: pending/answered)
  - `sb_chapter_answers` — Keith's answers to reader questions (visibility: public/private)
  - **`sb_story_favorites`** — bookmarked stories per user (user_id + story_id + story_title, unique constraint)
  - **`sb_story_highlights`** — saved text passages per user (user_id + story_id + passage_text 10–1000 chars + optional note)

- RLS enabled on all tables — policies cover all CRUD paths
- Auto-trigger: `handle_new_sb_user()` creates `sb_profiles` row on auth signup

### Routing
- `/` — Home (nav cards)
- `/stories` — Story library (search, filter by stage/theme, Volume 1 + published V2+)
- `/stories/[storyId]` — Story detail (filesystem-first, Supabase fallback for V2+)
- `/stories/timeline` — Timeline embedded in stories hub
- `/themes` — Themes/Principles browser (chord diagram, 12 themes)
- `/themes/[slug]` — Theme detail
- `/timeline` — Life timeline (grouped by decade, 32 events, with photos)
- `/journeys` — Guided Journeys list (4 curated journeys)
- `/journeys/[slug]` — Journey intro (story list, "Start Journey" CTA)
- `/journeys/[slug]/[step]` — Journey step (story + reflection + connectors)
- `/journeys/[slug]/complete` — Journey completion page
- `/journeys/[slug]/narrated` — Narrated journey view (new)
- `/ask` — Chat interface (streaming Claude responses, age-mode aware, multi-perspective)
- `/tell` — Story contribution (streaming AI interviewer, draft review, submit, resume sessions)
- `/beyond` — Keith's dedicated story workspace (keith role only — routes to StoryContributionWorkspace)
- `/admin/drafts` — Admin review + publish of contributed stories (admin-only)
- `/profile` — User profile (age mode, display name, Q&A notification, reading dashboard)
- `/profile/questions` — Reader Q&A inbox (my questions + Keith's answers)
- `/profile/favorites` — Bookmarked stories (heart icon on story pages)
- `/profile/highlights` — Saved text passages (selection → save on story pages)
- `/welcome` — First-run onboarding tour (4 steps, age-aware, feature-flagged by `has_onboarded`)
- `/signup` — New user registration
- `/login` — Supabase auth
- `/auth/callback` — OAuth callback

- **API:**
  - `/api/ask` — Streaming Claude API endpoint (rate limited: 20/min, multi-perspective orchestrator)
  - `/api/tell` — Story-gathering chat endpoint (rate limited: 20/min)
  - `/api/tell/draft` — Compose story draft from session (rate limited: 5/min)
  - `/api/tell/draft/update` — PATCH draft title/body before submit
  - `/api/tell/sessions` — GET in-progress gathering sessions
  - `/api/tell/sessions/[id]` — GET full message history for session
  - `/api/admin/drafts` — List drafts (admin-only)
  - `/api/admin/drafts/publish` — Publish a draft (admin-only)
  - `/api/conversations` — List conversations
  - `/api/conversations/[id]` — Get conversation with messages
  - `/api/stories/[storyId]/read` — POST to mark a story read (fires on page visit via ReadTracker)
  - `/api/stories/[storyId]/meta` — GET story metadata
  - `/api/stories/[storyId]/questions` — GET public Q&A / POST new reader question (rate: 10/hr)
  - `/api/beyond/questions` — GET pending questions (keith only)
  - `/api/beyond/questions/[id]/answer` — POST quick answer (keith only)
  - `/api/beyond/questions/[id]/seed-session` — POST start Beyond session from question (keith only)
  - `/api/notifications/count` — GET unread answer count (readers) + pending question count (Keith)
  - `/api/stories/[storyId]/favorite` — POST toggle favorite, GET favorite status
  - `/api/profile/favorites` — GET user's favorited stories list
  - `/api/stories/[storyId]/highlights` — POST save a highlight passage
  - `/api/profile/highlights` — GET user's saved highlights list
  - `/api/profile/highlights/[id]` — DELETE a specific highlight
  - `/api/profile/onboarding` — POST mark onboarding complete (sets `has_onboarded=true` + sets `sb_onboarded` cookie)

### Auth / Middleware
- Auth enforced via `src/proxy.ts` (Next.js 16 format)
- All routes except `/login`, `/signup`, `/auth/callback`, `/welcome`, `/api/*` require authentication
- Admin routes (`/admin/*`, `/api/admin/*`) gated by `sb_profiles.role = 'admin'`
- Keith routes (`/beyond`, `/api/beyond/*`) gated by `hasKeithSpecialAccess()` — checks `role = 'keith'` OR email match in `src/lib/auth/special-access.ts`
- **Onboarding gate:** `proxy.ts` now also redirects new (non-onboarded) users to `/welcome`
  - Fast-path: `sb_onboarded` cookie (1-year TTL) bypasses DB check on steady-state requests
  - On cache miss: queries `sb_profiles.has_onboarded`; sets cookie on first confirmed onboarded status
  - `/welcome`, auth paths, and all `/api/*` routes are allowlisted (no redirect loop)
  - `isOnboardingAllowlisted()` in `src/lib/auth/onboarding.ts`

### Age Mode System
- Three modes: `young_reader` (3-10), `teen` (11-17), `adult` (18+)
- Derived from `sb_profiles.age` or set manually on profile page
- Context provider: `src/hooks/useAgeMode.tsx`
- Affects: AI system prompt language/depth, story audio controls

### AI / Ask Keith
- System prompt built in `src/lib/ai/prompts.ts`
- **Multi-perspective orchestrator** in `src/lib/ai/orchestrator.ts`:
  - Simple path: single Sonnet call (factual/list/lookup questions)
  - Deep path: storyteller + principles coach (parallel) → synthesizer (streamed)
  - Feature-flagged via `ENABLE_DEEP_ASK=true` env var (currently disabled in prod)
  - Depth classifier: `src/lib/ai/classifier.ts` — defaults to "deep", simple only for factual patterns
  - Perspective prompts: `src/lib/ai/perspectives.ts`
- Rate limiting: 20 req/min per user
- Double-submit guard: `sendInFlightRef` in `ask/page.tsx`
- SSE stream parsing: buffered with TextDecoder stream:true, per-line try/catch

### AI / Tell + Beyond (Story Contribution)
- System prompt in `src/lib/ai/tell-prompts.ts` with two modes: `gathering` and `drafting`
- `StoryContributionWorkspace` component handles both `/tell` (family) and `/beyond` (Keith)
- `contributionMode: "tell" | "beyond"` controls which API endpoints are called
- Beyond workspace: shows pending reader questions in triage strip; Keith can quick-answer or seed a session from a question
- Rate limiting: 20/min gathering, 5/min drafting
- Resume sessions: in-progress sessions show on empty state with "Continue" button

### Reader Q&A System (NEW in Run 5)
- **Reader flow:** Click "Write to Keith" on any story page → `AskAboutStory` form → POST `/api/stories/[storyId]/questions` → question shows in Keith's Beyond triage strip
- **Keith flow:** See pending questions in Beyond → quick-answer (text only) OR seed a Beyond session (AI-assisted story expansion) → answer appears on story page
- **Visibility:** `public` (shown to all readers) or `private` (only to the asker)
- **Notifications:** Profile nav shows dot (readers with new answers) or count badge (Keith with pending questions)
- **Reader inbox:** `/profile/questions` lists all questions + answers

### Story Audio (NEW in Run 5)
- `StoryAudioControls` component on story pages (Web Speech API, no server cost)
- Play/Pause/Stop controls, estimated listen time from `wordCount`
- `src/lib/story-audio.ts` — `formatEstimatedListenLabel()` utility

### Story Read Tracking + User Reading Dashboard (SHIPPED)
- `sb_story_reads` table — upsert on story visit, user_id + story_id (unique)
- `ReadTracker` component fires POST silently on story page load
- Keith's analytics dashboard (`keith-dashboard.ts`) shows read metrics (total reads, top stories, weekly trends)
- **`ProfileReadingDashboard.tsx`** — shown on `/profile` for family members: read count, most-recent date, top 3 themes, top 4 principles (derived from `sb_story_reads` + static story metadata)
- **NOT YET:** Read badges on story cards (IDEA-014 remaining piece)

### Guided Journeys
- 4 journeys in `content/wiki/journeys/`: growing-up-in-the-south, leadership-under-pressure, roots-and-values, the-making-of-a-career
- Progress tracked via localStorage (no DB required)
- Journey files define: storyIds, reflections (per-story), connectors (transition text between steps)
- Ask Keith is journey-aware: `journeySlug` param adds journey context to system prompt
- `/journeys/[slug]/narrated` — narrated view (recently added)

### Story Favorites + Highlights (SHIPPED)
- **`FavoriteButton.tsx`** — heart toggle on story detail pages; optimistic update via `sb_story_favorites`
- **`/profile/favorites`** — grid of all bookmarked stories with cover-style cards and a "Go read" link
- **`StoryBodyWithHighlighting.tsx`** — wraps `StoryMarkdown` on story pages; listens for `selectionchange`, shows floating "Save this passage" button above selected text; saves to `sb_story_highlights`
- **`/profile/highlights`** — reading-journal layout of all saved passages, grouped by story, with delete button
- Rate limited: 30/min for highlights, standard limits for favorites
- ProfileHero quick links: "♥ My favorites" + "✎ My passages"

### Welcome / Onboarding (SHIPPED)
- `/welcome` — first-run tour for new family members
- `OnboardingStepper.tsx` — 4-step age-aware walkthrough (Read, Ask, Journeys, Tell demos)
- `steps.ts` — step config + `getSteps(ageMode)` factory; demo components in `welcome/demos/`
- Completion: POST `/api/profile/onboarding` → `has_onboarded=true` in DB + `sb_onboarded` cookie → redirect to `/`
- Replay: `/welcome?replay=1` link in ProfileHero ("Take the tour again"); replay=true skips DB update
- New users automatically redirected to `/welcome` by proxy gate (cookie fast-path for existing users)

### Book Images — Original Memoir Photos (SHIPPED)
- 35 JPEG photos extracted from the memoir PDF via `cobb_brain_lab/`
- Stored in `public/book-images/` (filenames: `page-NNN_img-NN_xref-NNNN.jpeg`)
- Referenced inline in 17 story wiki markdown files (via `![alt](path)` syntax)
- `StoryMarkdown.tsx` renders story content with click-to-expand lightbox for images
- "Fit to Screen" / "Actual Size" / "Open Original" controls in lightbox
- `cobb_brain_lab/book_images_manifest.csv` — full manifest of all extracted images

### Content Pipeline (cobb_brain_lab/)
- Standalone Python project for extracting stories from PDF memoir
- Story IDs: Volume 1 = `P1_S01–P1_S39`, Volume 2+ = `P2_S01+` (Supabase)
- Regex pattern in all scripts/parsers updated to `P\d+_S\d+` for multi-volume support
- `book_images_manifest.csv` — 35 images with page refs and xref IDs

### Timeline
- 32 events across life stages
- 14 photos added to `public/timeline/` (jpg files)
- Also accessible at `/stories/timeline` in the Stories hub

## Conventions
- All Supabase tables prefixed with `sb_`
- Story IDs: `P{volume}_S{nn}` (e.g., `P1_S09`, `P2_S01`)
- Theme slugs: kebab-case, matching filenames in `content/wiki/themes/`
- Wiki files: single source of truth for Volume 1 content
- Server components by default; client components marked with `'use client'`
- Rate limiter key pattern: `userId` for chat, `${userId}:draft` for drafting, `${userId}:question` for Q&A (10/hr)
- Keith-gated features use `hasKeithSpecialAccess(email, role)` from `src/lib/auth/special-access.ts`

## Recent Changes (Since Run 5)
- **Commit c7ebef7 "added original photos and user stats":**
  - 35 book images → `public/book-images/` (17 story wiki files updated with inline `![...]` refs)
  - `StoryMarkdown.tsx` — new dedicated story markdown renderer with click-to-expand lightbox
  - `ProfileReadingDashboard.tsx` + `src/lib/analytics/profile-dashboard.ts` — user reading stats section on profile
  - `ProfileHero.tsx` — full redesign; now receives `dashboard` prop, adds favorites/highlights/welcome links
  - `KeithProfileHero.tsx` — cleaned up (FIX-018 committed)
  - `classifier.ts` — deep-default logic committed (FIX-018 committed)
  - `globals.css` updates, `career-timeline.md` updated

- **Commit d8af9cc "added favorites":**
  - `FavoriteButton.tsx` — heart toggle, optimistic update
  - `sb_story_favorites` table (migration 011) — unique per user+story
  - `/api/stories/[storyId]/favorite` + `/api/profile/favorites`
  - `/profile/favorites/page.tsx`
  - `ProfileHero.tsx` "♥ My favorites" link added

- **Commit 5dd3116 "daily commit":**
  - `StoryBodyWithHighlighting.tsx` — text selection + floating "Save this passage" button
  - `sb_story_highlights` table (migration 012) — passage text + optional note
  - `/api/stories/[storyId]/highlights`, `/api/profile/highlights`, `/api/profile/highlights/[id]`
  - `/profile/highlights/page.tsx` + `DeleteHighlightButton.tsx`
  - `/welcome` page + `OnboardingStepper.tsx` + `steps.ts` + 4 demo components
  - `013_onboarding_flags.sql` — `has_onboarded` + `onboarded_at` on profiles; pre-seeds existing users
  - `proxy.ts` — onboarding gate (cookie fast-path + DB fallback → `/welcome`)
  - `/api/profile/onboarding` — marks tour complete; sets `sb_onboarded` cookie
  - `src/lib/auth/onboarding.ts` — cookie constants + `isOnboardingAllowlisted()`
  - `ProfileHero.tsx` — "✎ My passages" + "Take the tour again" links added

## Current State
- All V1–V4 features complete: stories, themes, timeline, ask (multi-perspective), journeys, tell, beyond, admin drafts, signup/profile, reader Q&A, favorites, highlights, reading dashboard, onboarding tour, book image lightbox
- Build: **PASSES** — clean, 38+ routes
- Lint: **3 warnings** — `_history` in `classifier.ts` (FIX-019) + 2 `<img>` in `StoryMarkdown.tsx` (FIX-020)
- 6 open issues (FIX-013, FIX-014, FIX-016, FIX-017, FIX-019, FIX-020) — FIX-019 + FIX-020 both have plans
- Content: All 39 stories; 35 original book photos; 14 timeline photos; wiki index current
- Auth: Multi-role system (member/admin/keith); onboarding gate for new users; all routes gated correctly
- Story reading tracked; profile reading dashboard live; story card read badges still pending (IDEA-014 partial)
- Multi-perspective Ask built but feature-flagged (IDEA-015)

## Known Issues (See FIXES.md)
- FIX-013: Fenced JSON fallback in /api/tell/draft not wrapped in try/catch (planned)
- FIX-014: ageMode not validated at runtime in /api/ask (planned)
- FIX-016: Tell page SSE state mutation (planned)
- FIX-017: Multiple draft rows per Tell session (planned)
- FIX-019: `_history` lint warning in classifier.ts (planned, 1 min)
- FIX-020: `<img>` ESLint warnings in StoryMarkdown.tsx (planned, 2 min)

## Next Actions (Priority Order)
1. **FIX-019 + FIX-020** — Fix 3 lint warnings (2 min total; pairs as one commit)
2. **IDEA-018** — Ask Keith from highlighted passage (1 hr; builds on shipped highlights)
3. **IDEA-014** — Story card read badges (1–1.5 hrs; completes the read progress feature)
4. **IDEA-017** — Original photos gallery at `/gallery` (2–2.5 hrs)
5. **IDEA-015** — Enable deep Ask mode (30 min eval + env var set)
6. **FIX-016** — Tell SSE state mutation (15 min port from ask/page.tsx)
7. **FIX-017** — Multiple draft rows per session (30 min upsert fix)
8. **FIX-013** — Fenced JSON fallback (10 min defensive coding)
9. **FIX-014** — ageMode runtime validation (5 min, one-liner)
