# STATUS — Keith Cobb Interactive Storybook

> Last updated: 2026-04-19 (Nightshift Run 8)

## App Summary

**Keith Cobb Interactive Storybook** is a private, family-only digital archive built around 49 stories (39 memoir + 10 interview) from Keith Cobb's life and leadership journey. Family members (especially grandchildren and great-grandchildren) can browse stories, explore principles/themes, view a life timeline, have AI-guided conversations ("Ask Keith"), follow curated Guided Journeys, contribute their own stories via the "Tell" feature, write notes/questions directly to Keith from any story page, flag OCR errors, bookmark favorites, save passages, browse the People directory, and experience a photo frame slideshow of original memoir photos.

**Domain:** stories.cobbcorner.com

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.3 (App Router), TypeScript 5 |
| Frontend | React 19, Tailwind CSS 4, @tailwindcss/typography |
| Content | Markdown wiki (`content/wiki/`) — pre-compiled, single source of truth |
| Database | Supabase (PostgreSQL) — auth + conversations + story contributions + Q&A + people + media |
| Auth | Supabase Auth (email-based, invite-only) |
| AI Chat | Claude Sonnet 4 (`claude-sonnet-4-20250514`) via Anthropic SDK 0.88.0 |
| Audio (TTS) | ElevenLabs (server-side, cached in `story-audio` bucket) + Web Speech API fallback |
| Rich Text | TipTap (ProseMirror-based WYSIWYG editor in Beyond workspace) |
| Content Rendering | react-markdown (used in Ask, Tell, Story Detail, Journey Steps) |

## Architecture

### Wiki-First Content
- All Keith's stories (Volume 1 = memoir P1_S01–P1_S39, IV = interview IV_S01–IV_S10) live in `content/wiki/` as markdown files
- People inventory compiled from `content/raw/people_inventory.json` into `content/wiki/people/` (58 people pages)
- Compiled from `content/raw/` via `scripts/compile-wiki.ts`
- Static data generated via `scripts/generate-static-data.ts` into `src/lib/wiki/static-data.ts`
- Family-contributed stories (Volume 2+) live in Supabase (`sb_story_drafts` with `status='published'`)
- Story detail page falls back from filesystem to Supabase for non-P1/IV story IDs

### Database (Supabase)
- **20 migrations** (up from 17 last run):
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
  - `013_story_corrections.sql` — **DUPLICATE PREFIX** (see FIX-022); `sb_story_corrections` table for reader OCR error reports
  - `014_story_audio.sql` — `sb_story_audio` ledger + `story-audio` Storage bucket for ElevenLabs cache
  - `015_beyond_write_mode.sql` — `sb_story_drafts.session_id` now nullable; `origin` column (`chat`|`write`|`edit`) added
  - `016_people.sql` — `sb_people` + `sb_story_people` tables; people as first-class entities
  - `017_media.sql` — `sb_media` table (polymorphic owner: story|person); `beyond-media` Storage bucket
  - `018_highlight_passage_conversation.sql` — `passage_ask_conversation_id` UUID column on `sb_story_highlights` (links a passage to a conversation)
  - `019_profile_reflections.sql` — `sb_profile_reflections` table; AI narrator reflection with cooldown + trigger logic
  - `020_wiki_mirror.sql` — `sb_story_integrations` + `sb_wiki_documents` tables; Beyond publish pipeline writes compiled stories into the wiki layer; RLS: all authenticated users read active docs; keith/admin write

- **Tables:**
  - `sb_profiles` — user profiles (display_name, age, age_mode, role: admin|member|keith, **has_onboarded**, **onboarded_at**)
  - `sb_conversations` + `sb_messages` — Ask Keith chat persistence
  - `sb_story_sessions` — Tell/Beyond: story-gathering chat sessions
  - `sb_story_messages` — Tell/Beyond: messages in a story-gathering session
  - `sb_story_drafts` — Tell/Beyond/Write: AI-composed or direct-written drafts; `session_id` nullable; `origin`: chat|write|edit
  - `sb_story_reads` — Read tracking: which users have read which stories
  - `sb_chapter_questions` — Reader questions submitted from story pages (status: pending/answered)
  - `sb_chapter_answers` — Keith's answers to reader questions (visibility: public/private)
  - `sb_story_favorites` — bookmarked stories per user (user_id + story_id + story_title, unique constraint)
  - `sb_story_highlights` — saved text passages per user (user_id + story_id + passage_text 10–1000 chars + optional note)
  - `sb_story_corrections` — reader-submitted OCR/transcription error reports (status: open/resolved); admin-triaged
  - `sb_story_audio` — ElevenLabs audio generation ledger (story_id + voice_id unique; cache key for Storage bucket)
  - `sb_people` — people as first-class entities (slug, display_name, relationship, bio_md, birth/death year); Keith/admin-editable
  - `sb_story_people` — link table: connects drafts or published stories to people via @mentions
  - `sb_media` — polymorphic media attachments (story or person owner); soft-delete; `beyond-media` bucket
  - `sb_profile_reflections` — per-user AI narrator reflection (cooldown: 24h; triggers: +3 reads, +1 saved, +1 asked)
  - `sb_story_integrations` — compiled metadata per Beyond publish (version, content_hash, themes, principles, quotes, timeline_events, related_story_ids)
  - `sb_wiki_documents` — compiled wiki documents per Beyond publish (doc_type: story|theme|principle|timeline|index|ask_context; versioned; status: active|superseded)

- RLS enabled on all tables — policies cover all CRUD paths
- Auto-trigger: `handle_new_sb_user()` creates `sb_profiles` row on auth signup

### Routing
- `/` — Home (nav cards + Photo Frame button)
- `/stories` — Story library (search, filter by stage/theme/source, Volume 1 + interview + published V2+)
- `/stories/[storyId]` — Story detail (filesystem-first, Supabase fallback for V2+; ElevenLabs audio; lightbox photos; highlight selection; correction report)
- `/stories/timeline` — Timeline embedded in stories hub
- `/themes` — Themes browser (ChordDiagram + ThemePrincipleMatrix + StorySankey visualizations; 12 themes)
- `/principles` — Principles browser (12 canonical principles with `PrincipleFormationTimeline` SVG; "Ask About This" CTA per principle)
- `/principles/[slug]` — Principle detail (AI narrative, supporting statements, related theme pills, linked stories)
- `/themes/[slug]` — Theme detail
- `/timeline` — Life timeline (grouped by decade, 43 events, with photos)
- `/people` — People directory (58 people, 2-column grid with story counts)
- `/people/[slug]` — Person detail (bio, relationship, story appearances, media panel; Keith-editable drawer)
- `/journeys` — Guided Journeys list (4 curated journeys)
- `/journeys/[slug]` — Journey intro (story list, "Start Journey" CTA)
- `/journeys/[slug]/[step]` — Journey step (story + reflection + connectors)
- `/journeys/[slug]/complete` — Journey completion page
- `/journeys/[slug]/narrated` — Narrated journey view
- `/ask` — Chat interface (streaming Claude responses, age-mode aware, multi-perspective)
- `/tell` — Story contribution (streaming AI interviewer, draft review, submit, resume sessions)
- `/beyond` — Keith's dedicated story workspace (keith role only)
  - QA Mode: triage reader questions, quick-answer or seed sessions
  - Edit Mode: TipTap WYSIWYG editor for drafts + published story revisions; AI polish panel
  - People Mode: manage people entities, edit bios, attach media
- `/admin/drafts` — Admin review + publish of contributed stories (admin-only)
- `/admin/media` — Admin media management (admin-only)
- `/profile` — User profile (age mode, display name, Q&A notification, reading dashboard)
- `/profile/questions` — Reader Q&A inbox (my questions + Keith's answers)
- `/profile/favorites` — Bookmarked stories (heart icon on story pages)
- `/profile/highlights` — Saved text passages (selection → save on story pages)
- `/profile/admin` — Admin triage for story corrections (admin-only)
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
  - `/api/admin/corrections` — GET all open corrections (admin-only)
  - `/api/admin/corrections/[id]` — PATCH resolve a correction (admin-only)
  - `/api/admin/media` — List/manage media (admin-only)
  - `/api/admin/media/[id]` — Update/delete specific media (admin-only)
  - `/api/conversations` — List conversations
  - `/api/conversations/[id]` — Get conversation with messages
  - `/api/stories/[storyId]/read` — POST to mark a story read (fires on page visit via ReadTracker)
  - `/api/stories/[storyId]/meta` — GET story metadata
  - `/api/stories/[storyId]/questions` — GET public Q&A / POST new reader question (rate: 10/hr)
  - `/api/stories/[storyId]/corrections` — POST submit OCR error report (rate: 20/min)
  - `/api/stories/[storyId]/audio` — GET ElevenLabs audio URL (cached); returns stream URL
  - `/api/stories/[storyId]/audio/stream` — GET streaming ElevenLabs TTS (rate: 5/15min)
  - `/api/beyond/questions` — GET pending questions (keith only)
  - `/api/beyond/questions/[id]/answer` — POST quick answer (keith only)
  - `/api/beyond/questions/[id]/seed-session` — POST start Beyond session from question (keith only)
  - `/api/beyond/drafts` — GET drafts list for Beyond Edit mode; POST new direct-write draft
  - `/api/beyond/drafts/[id]` — GET/PATCH/DELETE a specific draft
  - `/api/beyond/drafts/[id]/publish` — POST publish a Beyond draft
  - `/api/beyond/drafts/from-story` — POST create a revision draft from a published story
  - `/api/beyond/media` — GET/POST media for a story or person (keith/admin only)
  - `/api/beyond/media/[id]` — PATCH caption/order, DELETE (soft) a media item
  - `/api/beyond/polish` — POST AI polish a draft section (keith only)
  - `/api/beyond/published-stories` — GET list of published V1 + V2 stories for Edit mode picker
  - `/api/notifications/count` — GET unread answer count (readers) + pending question count (Keith)
  - `/api/people` — GET search/list people; POST create person (keith-gated)
  - `/api/people/[slug]` — GET/PATCH a specific person (keith-gated for write)
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
- **Onboarding gate:** `proxy.ts` redirects new (non-onboarded) users to `/welcome`
  - Fast-path: `sb_onboarded` cookie (1-year TTL) bypasses DB check on steady-state requests
  - On cache miss: queries `sb_profiles.has_onboarded`; sets cookie on first confirmed onboarded status

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
- **People context:** `getPeopleContext()` in `prompts.ts` includes Tier A/B bios (IDEA-019, shipped)
- **Corpus integration (Run 8):** orchestrator calls `getCanonicalWikiSummaries()` + `getCanonicalStoryLinkCatalog()` from `corpus.ts` — Beyond family stories now visible to Ask Keith after publish
- **Principles gap:** 12 canonical principles with rich `aiNarrative` exist in parser but are NOT yet in the Ask system prompt — see IDEA-022
- `?prompt=` URL parameter added to Ask page — used by principle "Ask About This" CTAs

### AI / Tell + Beyond (Story Contribution)
- System prompt in `src/lib/ai/tell-prompts.ts` with two modes: `gathering` and `drafting`
- `StoryContributionWorkspace` component handles `/tell` (family)
- Beyond workspace has 3 mode tabs: QA, Edit, People
- **Beyond Edit Mode** — `BeyondEditMode.tsx` + `BeyondDraftEditor.tsx` + `TipTapEditor.tsx`:
  - `sb_story_drafts.session_id` is now nullable (`origin = 'write'` for direct writes)
  - Keith can open a published story chapter as a draft for revision (`origin = 'edit'`)
  - TipTap WYSIWYG editor with @mention support (people autocomplete via `api/people`)
  - AI Polish panel for targeted paragraph improvements
  - Warning gate when opening published chapters to prevent accidental overwrites
- `contributionMode: "tell" | "beyond"` controls which API endpoints are called
- Beyond workspace: shows pending reader questions in triage strip; Keith can quick-answer or seed a session from a question
- Rate limiting: 20/min gathering, 5/min drafting
- Resume sessions: in-progress sessions show on empty state with "Continue" button

### Reader Q&A System
- **Reader flow:** Click "Write to Keith" on any story page → `AskAboutStory` form → POST `/api/stories/[storyId]/questions` → question shows in Keith's Beyond triage strip
- **Keith flow:** See pending questions in Beyond QA tab → quick-answer (text only) OR seed a Beyond session (AI-assisted story expansion) → answer appears on story page
- **Visibility:** `public` (shown to all readers) or `private` (only to the asker)
- **Notifications:** Profile nav shows dot (readers with new answers) or count badge (Keith with pending questions)

### Story Audio
- **ElevenLabs TTS** (primary): server-side synthesis, MP3 cached in `story-audio` Supabase Storage bucket
  - `sb_story_audio` ledger tracks (story_id, voice_id) unique pairs
  - `/api/stories/[storyId]/audio` returns cached URL or triggers generation
  - `/api/stories/[storyId]/audio/stream` — streaming TTS for low-latency first play
  - Rate limited: 5/15min per user (to bound ElevenLabs spend)
  - Falls back to Web Speech API if ElevenLabs not configured or errors
- **Web Speech API** (fallback): browser-native TTS, no server cost
- `StoryAudioControls.tsx` — unified component, defaults to `mode="elevenlabs"`, falls back automatically
- ElevenLabs config: `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` env vars (see `.env.local.example`)

### Story Corrections
- Any authenticated reader can flag an OCR/transcription error from a story page
- `sb_story_corrections` table with status `open` | `resolved`
- Admin triage at `/profile/admin` — `CorrectionActions.tsx` to resolve/dismiss
- Rate limited: 20/min per user

### People Inventory (NEW in Run 7)
- 58 people pages compiled from `content/raw/people_inventory.json` + overrides
- Wiki pages in `content/wiki/people/` (one per person, with AI-drafted bios for major figures)
- Tiers: A (dedicated story), B (recurring), C (curated), D (across memoir + interviews)
- Routes: `/people` (directory) + `/people/[slug]` (detail with stories, bio, media)
- `PersonEditDrawer` — Keith-only inline editor for bio, relationship, birth/death year
- `PersonMediaPanel` — photo gallery attached to a person (from `sb_media`)
- `sb_people` (DB source of truth for bio, overrides wiki markdown bio)
- `sb_story_people` link table — connects stories to mentioned people via @mentions
- `PersonLink.tsx` — inline person mention chip (links to `/people/[slug]`)

### Media Attachments (NEW in Run 7)
- `sb_media` — polymorphic: owner_type = 'story' | 'person', owner_id = draft UUID or story_id string
- `beyond-media` Supabase Storage bucket (see `supabase/storage-setup.sql`)
- `MediaGallery.tsx` — editable gallery in Beyond (caption edit, sort, delete)
- `/api/beyond/media` — list, upload, update, soft-delete (keith/admin-gated)
- Photos are non-sensitive; bucket is public; app auth gates the UI

### Story Read Tracking + User Reading Dashboard
- `sb_story_reads` table — upsert on story visit, user_id + story_id (unique)
- `ReadTracker` component fires POST silently on story page load
- Keith's analytics dashboard (`keith-dashboard.ts`) shows read metrics
- `ProfileReadingDashboard.tsx` — shown on `/profile` for family members: read count, most-recent date, top 3 themes, top 4 principles
- Story card read badges still pending (IDEA-014)

### Photo Frame (NEW in Run 7 — IDEA-017 SHIPPED)
- `PhotoFrameOverlay.tsx` — fullscreen crossfade slideshow of 35 memoir photos
- Triggered from home page button
- Fullscreen API, 8-second advance, 1.2s crossfade, 30s pause-on-tap, preloads next image
- Escape key or fullscreen exit closes the overlay

### Guided Journeys
- 4 journeys in `content/wiki/journeys/`: growing-up-in-the-south, leadership-under-pressure, roots-and-values, the-making-of-a-career
- Progress tracked via localStorage (no DB required)

### Story Favorites + Highlights
- **`FavoriteButton.tsx`** — heart toggle on story detail pages
- **`/profile/favorites`** — grid of bookmarked stories
- **`StoryBodyWithHighlighting.tsx`** — text selection + floating "Save this passage" button
- **`/profile/highlights`** — reading-journal layout of saved passages grouped by story

### Welcome / Onboarding
- `/welcome` — first-run tour for new family members (4-step age-aware walkthrough)
- New users auto-redirected to `/welcome` by proxy gate (cookie fast-path)

### Book Images — Original Memoir Photos
- 35 JPEG photos in `public/book-images/`
- Referenced inline in 17 story wiki files
- `StoryMarkdown.tsx` renders with click-to-expand lightbox

### Content Pipeline (cobb_brain_lab/)
- 39 memoir stories (P1_S01–P1_S39) + 10 interview stories (IV_S01–IV_S10)
- People inventory: `cobb_brain_lab/` + `content/raw/people_inventory.json`
- `book_images_manifest.csv` — 35 images with page refs and xref IDs

### Timeline
- 43 events across life stages
- 14 photos added to `public/timeline/`

## Conventions
- All Supabase tables prefixed with `sb_`
- Story IDs: `P{volume}_S{nn}` (memoir), `IV_S{nn}` (interview)
- Theme slugs: kebab-case, matching filenames in `content/wiki/themes/`
- Wiki files: single source of truth for Volume 1 content
- Server components by default; client components marked with `'use client'`
- Rate limiter key pattern: `userId` for chat, `${userId}:draft` for drafting, `${userId}:question` for Q&A (10/hr)
- Keith-gated features use `hasKeithSpecialAccess(email, role)` from `src/lib/auth/special-access.ts`
- People API: GET is public (no auth required for `/api/people`); POST/PATCH is Keith-gated

## Recent Changes (Since Run 6)
- **Commit `4fa9d60` "fixing ocr errors":** Story corrections system — `sb_story_corrections` (migration 013), `/api/stories/[storyId]/corrections`, `CorrectionActions.tsx`, `/profile/admin` page
- **Commit `afb3d73` "ui improvements":** Various UI polish passes
- **Commit `ef8cfdb` "fixed error notification":** Error toast/notification improvements
- **Commit `be2d3fd` "adding photo frame":** `PhotoFrameOverlay.tsx` — IDEA-017 SHIPPED
- **Commit `d354a7f` "making voice default":** ElevenLabs audio now default; `StoryAudioControls` defaults to `mode="elevenlabs"`. Requires `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` env vars
- **Commit `8995c35` "people_inventory":** People inventory system — migration 016, `/people` + `/people/[slug]` routes, 58 wiki people pages, `PersonLink`, `PersonEditDrawer`, `PersonMediaPanel`
- **Commit `aaecd69` "added rich people history":** Wiki people bios AI-drafted, `content/wiki/people/` fully populated
- **Commit `73779e6` "added keith editing options":** Beyond Edit mode — `BeyondEditMode.tsx`, `BeyondDraftEditor.tsx`, `TipTapEditor.tsx`, `BeyondModeTabs.tsx`, migration 015
- **Commit `43cfb4b` "added full edit capability to Beyond space now":** Media attachments — migration 017, `MediaGallery.tsx`, `/api/beyond/media`, `BeyondPeopleMode.tsx`; also ElevenLabs infrastructure (migration 014, `src/lib/elevenlabs/`, `src/lib/story-audio/generate.ts`)

### Wiki Mirror System (NEW in Run 8)
- `src/lib/wiki/wiki-mirror.ts` — Beyond publish pipeline: converts TipTap HTML to markdown, builds `StoryIntegration` struct, writes to `sb_wiki_documents` + `sb_story_integrations`
- `src/lib/wiki/corpus.ts` — merged filesystem + DB story corpus; `getCanonicalStories()`, `getCanonicalWikiSummaries()`, `getCanonicalStoryLinkCatalog()`; 30-second in-memory cache
- On Beyond publish: `publishStoryToWikiMirror()` supersedes old doc, inserts new one, then calls `rebuildDerivedWikiMirrorDocuments()` (theme, timeline, index docs)
- Ask Keith now sees Beyond family stories after they publish (corpus feeds system prompt via orchestrator)

### Principles as First-Class Items (NEW in Run 8)
- 12 canonical principles defined in `src/lib/wiki/parser.ts` (line 184) with slug, title, shortTitle, thesis, narrative, aiNarrative, themeSlugs, matchTerms, seedStoryIds
- `getAllCanonicalPrinciples()` matches raw story principles to canonical definitions via scoring
- `src/app/principles/page.tsx` — browser with `PrincipleFormationTimeline` SVG + "Ask About This" CTAs
- `src/app/principles/[slug]/page.tsx` — detail: AI narrative, supporting statements, related themes, linked stories
- **3 new viz components:** `PrincipleFormationTimeline.tsx`, `StorySankey.tsx`, `ThemePrincipleMatrix.tsx`
- `StorySankey` and `ThemePrincipleMatrix` shown on `/themes` page alongside existing `ChordDiagram`
- `src/lib/wiki/graph.ts` significantly expanded: `buildEraPrincipleMatrix()`, `buildStorySankey()`, `buildThemePrincipleMatrix()`, `buildPeopleGraph()`
- **Tests:** 41 tests pass via `npm test` (Node built-in test runner + tsx); test files: `graph.test.ts`, `parser.test.ts`, `layout.test.ts`

### Recent Changes (Since Run 7)
- **Commit `c0411d6`:** IDEA-019 SHIPPED — People biographical context in Ask Keith
- **Commit `1bf9147`:** FIX-019/020/021 RESOLVED — Full lint sweep, 0 errors 0 warnings
- **Commits `d3c232b`+:** IDEA-020 SHIPPED — Profile reflection gallery merged
- **Commit `9700ec4`:** Copy updates across multiple pages; AgeModeSwitcher improvements
- **Commit `629c250`:** ProfileGallery layout fixes; HomeHero copy
- **Commit `1c71904`:** Principles as first-class items — `/principles`, `/principles/[slug]`, viz components, `graph.ts` expansion, tests added
- **Commit `114ccac`:** `parser.ts` expanded principles matching
- **Commit `0f8758f`:** Wiki mirror system — `wiki-mirror.ts`, `corpus.ts`, migration 020; orchestrator updated to use corpus; `StoriesPageClient` extracted; `BeyondDraftEditor` updated

## Current State
- All features complete: stories, themes, timeline, ask (corpus-aware + people bios), journeys, tell, beyond (QA + Edit + People modes + wiki publish pipeline), admin, signup/profile, reader Q&A, favorites, highlights, profile reflection gallery, onboarding tour, book image lightbox, photo frame, people directory, media attachments, ElevenLabs audio, story corrections, **principles browser**, **wiki mirror**
- Build: **PASSES** — clean, 54 routes (up from 44)
- Lint: **PASSES** — 0 errors, 0 warnings (clean since `1bf9147`)
- Tests: **41 PASS** — `npm test` (Node built-in test runner)
- **Note on migration numbering:** Two migrations named `013_*` — see FIX-022 (low-risk naming conflict)
- 5 open issues (FIX-013, FIX-014, FIX-016, FIX-017, FIX-022, FIX-023, FIX-024, FIX-025)

## Known Issues (See FIXES.md)
- FIX-013: Fenced JSON fallback in /api/tell/draft not wrapped in try/catch (planned)
- FIX-014: ageMode not validated at runtime in /api/ask (planned)
- FIX-016: Tell page SSE state mutation (planned)
- FIX-017: Multiple draft rows per Tell session (planned)
- FIX-022: Dual `013_` migration prefix naming conflict (planned, low risk)
- FIX-023: `publishStoryToWikiMirror` non-atomic DB operations — story can go dark on partial failure (planned)
- FIX-024: `invalidateWikiCorpusCache()` is a no-op in Vercel serverless (planned, doc-only fix)
- FIX-025: `key={paragraph}` using text content as React key in principle detail page (planned, 1-line fix)

## Next Actions (Priority Order)
1. **IDEA-022** — Principles context in Ask Keith (30 min; closes the last Ask quality gap)
2. **FIX-025** — key={paragraph} fix (1 min; one-liner)
3. **FIX-023** — Wiki mirror atomicity recovery (15 min; prevents story going dark on publish error)
4. **FIX-024** — Corpus cache doc comment (5 min; docs-only, no behavior change)
5. **IDEA-014** — Story card read badges (45 min; completes the read progress feature)
6. **IDEA-023** — Explore Hub / Story Map (1.5–2 hrs; connects the scattered viz components)
7. **FIX-016** — Tell SSE state mutation (15 min port)
8. **FIX-017** — Multiple draft rows per session (30 min upsert fix)
9. **FIX-013** — Fenced JSON fallback (10 min defensive coding)
10. **FIX-014** — ageMode runtime validation (5 min, one-liner)
