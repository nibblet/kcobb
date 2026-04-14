# STATUS — Keith Cobb Interactive Storybook

> Last updated: 2026-04-14 (Nightshift Run 3)

## App Summary

**Keith Cobb Interactive Storybook** is a private, family-only digital archive built around 39 stories from Keith Cobb's life and leadership journey. Family members (especially grandchildren and great-grandchildren) can browse stories, explore principles/themes, view a life timeline, have AI-guided conversations ("Ask Keith"), follow curated Guided Journeys, and contribute their own stories via the "Tell" feature.

**Domain:** stories.cobbcorner.com

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.3 (App Router), TypeScript 5 |
| Frontend | React 19, Tailwind CSS 4, @tailwindcss/typography |
| Content | Markdown wiki (`content/wiki/`) — pre-compiled, single source of truth |
| Database | Supabase (PostgreSQL) — auth + conversations + story contributions |
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
- 6 tables (all prefixed `sb_`):
  - `sb_profiles` — user profiles (display_name, age, age_mode, role: admin|member)
  - `sb_conversations` + `sb_messages` — Ask Keith chat persistence
  - `sb_story_sessions` — Tell feature: story-gathering chat sessions
  - `sb_story_messages` — Tell feature: messages in a story-gathering session
  - `sb_story_drafts` — Tell feature: AI-composed story drafts, publishable to library
- 3 migrations: `001_initial_schema.sql`, `002_signup_profile_age.sql`, `003_story_sessions.sql`
- RLS enabled on all tables — policies cover all CRUD paths
- Auto-trigger: `handle_new_sb_user()` creates `sb_profiles` row on auth signup

### Routing
- `/` — Home (nav cards)
- `/stories` — Story library (search, filter by stage/theme, Volume 1 + published V2+)
- `/stories/[storyId]` — Story detail (filesystem-first, Supabase fallback for V2+)
- `/themes` — Themes/Principles browser (12 themes)
- `/themes/[slug]` — Theme detail
- `/timeline` — Life timeline (grouped by decade, 32 events, with photos)
- `/journeys` — Guided Journeys list (4 curated journeys)
- `/journeys/[slug]` — Journey intro (story list, "Start Journey" CTA)
- `/journeys/[slug]/[step]` — Journey step (story + reflection + connectors)
- `/journeys/[slug]/complete` — Journey completion page
- `/ask` — Chat interface (streaming Claude responses, age-mode aware)
- `/tell` — Story contribution (streaming AI interviewer, draft review, submit)
- `/admin/drafts` — Admin review + publish of contributed stories (admin-only)
- `/profile` — User profile (age mode, display name)
- `/signup` — New user registration
- `/login` — Supabase auth
- `/auth/callback` — OAuth callback
- `/api/ask` — Streaming Claude API endpoint (rate limited: 20/min)
- `/api/tell` — Story-gathering chat endpoint (rate limited: 20/min)
- `/api/tell/draft` — Compose story draft from session (rate limited: 5/min — FIX-009 planned)
- `/api/admin/drafts` — List drafts (admin-only)
- `/api/admin/drafts/publish` — Publish a draft (admin-only, assigns story_id)
- `/api/conversations` — List conversations
- `/api/conversations/[id]` — Get conversation with messages

### Auth / Middleware
- Auth enforced via `src/proxy.ts` (Next.js 16 format — FIX-001 resolved)
- All routes except `/login`, `/signup`, `/auth/callback` require authentication
- Admin routes (`/admin/*`, `/api/admin/*`) gated by `sb_profiles.role = 'admin'` check

### Age Mode System
- Three modes: `young_reader` (3-10), `teen` (11-17), `adult` (18+)
- Derived from `sb_profiles.age` or set manually on profile page
- Context provider: `src/hooks/useAgeMode.tsx`
- Currently affects: AI system prompt language/depth only
- NOT yet affecting: suggestion chips in Ask (IDEA-003 still open), Tell page, UI copy

### AI / Ask Keith
- System prompt built in `src/lib/ai/prompts.ts`
- Includes: voice guide, story link catalog (for markdown links in responses), wiki index, journey/story context
- Claude links to specific stories using `/stories/P1_SXX` format
- Rate limiting: 20 req/min per user
- Double-submit guard: `sendInFlightRef` in `ask/page.tsx`
- SSE stream parsing: buffered with TextDecoder stream:true, per-line try/catch

### AI / Tell (Story Contribution)
- System prompt in `src/lib/ai/tell-prompts.ts` with two modes: `gathering` and `drafting`
- Gathering mode: warm interviewer who draws out story details naturally
- Drafting mode: story composer that produces structured JSON (title, body, life_stage, themes, etc.)
- Sessions saved to `sb_story_sessions` + `sb_story_messages`
- Draft saved to `sb_story_drafts` with status: draft → published
- Rate limiting: 20/min on gathering, NOT YET on drafting (FIX-009 open)
- FIX-008 open: `submitDraft()` doesn't save user's title/body edits back to Supabase

### Guided Journeys
- 4 journeys in `content/wiki/journeys/`: growing-up-in-the-south, leadership-under-pressure, roots-and-values, the-making-of-a-career
- Progress tracked via localStorage (no DB required)
- Journey files define: storyIds, reflections (per-story), connectors (transition text between steps)
- Ask Keith is journey-aware: `journeySlug` param adds journey context to system prompt

### Content Pipeline (cobb_brain_lab/)
- Standalone Python project for extracting stories from PDF memoir
- Story IDs: Volume 1 = `P1_S01–P1_S39`, Volume 2+ = `P2_S01+` (Supabase)
- Regex pattern in all scripts/parsers updated to `P\d+_S\d+` for multi-volume support

### Timeline
- 32 events across life stages
- 14 photos added to `public/timeline/` (jpg files)
- Timeline page updated to show photos alongside events

## Conventions
- All Supabase tables prefixed with `sb_`
- Story IDs: `P{volume}_S{nn}` (e.g., `P1_S09`, `P2_S01`)
- Theme slugs: kebab-case, matching filenames in `content/wiki/themes/`
- Wiki files: single source of truth for Volume 1 content
- Server components by default; client components marked with `'use client'`
- Rate limiter key pattern: `userId` for chat, `${userId}:draft` for drafting endpoint

## Current State
- V1 + V2 features complete: stories, themes, timeline, ask, journeys, tell, admin drafts, signup/profile
- Build: **PASSES** — clean, no warnings
- Lint: **1 warning** — `_node` unused in ask/page.tsx (FIX-012, trivial)
- 5 open issues (FIX-008 through FIX-012) — all planned
- No tests written yet
- No CI/CD pipeline configured
- No error monitoring or analytics

## Known Issues (See FIXES.md)
- FIX-008: submitDraft ignores user edits (planned, HIGH — user data loss)
- FIX-009: no rate limit on /api/tell/draft, raw Claude response in error (planned, MEDIUM)
- FIX-010: getWikiSummaries() no cache in tell-prompts (planned, LOW-MEDIUM)
- FIX-011: dead generateStaticParams in journey routes (planned, LOW)
- FIX-012: _node unused lint warning in ask/page.tsx (planned, VERY LOW)

## Next Actions (Priority Order)
1. **FIX-008** — submitDraft saves edits (30 min, prevents user data loss)
2. **FIX-009** — Rate limit /api/tell/draft + remove raw leak (15 min, financial/privacy safety)
3. **IDEA-003** — Age-aware suggestion chips in Ask (20 min, no deps, big UX value for kids)
4. **IDEA-007** — Resume Tell session (1.5–2 hrs, great UX for contributors)
5. **FIX-010** — Cache wiki summaries in tell-prompts (10 min, performance)
6. **FIX-011** — Remove dead generateStaticParams in journeys (5 min, code hygiene)
7. **FIX-012** — Fix unused _node lint warning (5 min)
8. **IDEA-002 (remaining)** — Admin direct story editor for Keith (Track 2, 4–6 hours)
