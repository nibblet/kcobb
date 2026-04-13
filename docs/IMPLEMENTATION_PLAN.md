# Keith Cobb Interactive Storybook — Implementation Plan

> **Reference**: [REQUIREMENTS.md](./REQUIREMENTS.md)
> **Last Updated**: 2026-04-12

---

## Approach

**Wiki-first architecture.** The pre-compiled wiki is the single source of truth for all content. Supabase handles only auth, user profiles, and conversation history. No content tables in the database.

This plan is ordered by **structural dependency**. All features ship together as V1 — the phasing is about build order, not release order.

**Phases**: 6
**Each phase is a deployable checkpoint.**

---

## Phase 1: Project Scaffold & Auth

**Goal**: Next.js app with Supabase auth, deployed. Logged-in user sees a placeholder home screen. Logged-out user sees nothing.

### Tasks

1. **Initialize Next.js project**
   - Next.js 14+ with App Router
   - TypeScript
   - Tailwind CSS
   - `src/` directory structure

2. **Supabase project setup**
   - Create Supabase project (if not already done)
   - Configure environment variables (`.env.local`):
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

3. **Database tables** (Supabase migrations — minimal)
   - `profiles` (extends `auth.users`):
     - `display_name`, `age`, `age_mode`, `role`
   - `conversations`:
     - `user_id`, `title`, `age_mode`, `created_at`, `updated_at`
   - `messages`:
     - `conversation_id`, `role`, `content`, `cited_story_slugs`, `created_at`
   - RLS policies:
     - `profiles`: users read/update own
     - `conversations` / `messages`: users access own only
     - Admin has full access

4. **Auth integration**
   - Install `@supabase/supabase-js` and `@supabase/ssr`
   - Supabase auth middleware (protect all routes)
   - Login page (`/login`)
   - Auth callback handler (`/auth/callback`)

5. **Layout shell**
   - Root layout with:
     - Mobile-first responsive nav (bottom tab bar or hamburger)
     - Header with logo/title
     - Age mode toggle (reads from / writes to user profile)
   - Protected route wrapper
   - Age mode React context provider

6. **Placeholder home page**
   - Brief intro text
   - Three navigation cards (Read a Story, Explore by Topic, Ask a Question)
   - All link to placeholder pages

7. **Deploy**
   - Vercel (recommended for Next.js) or Cloudflare Pages
   - Connect custom domain: `stories.cobbcorner.com`
   - Environment variables in hosting provider

### Deliverable
Logged-in family members see a home screen with navigation. Everything behind auth.

---

## Phase 2: Content Ingestion & Wiki Compilation

**Goal**: Raw content files loaded into the repo. Wiki compiled from raw sources. All content available as structured markdown files ready for the UI.

### Content Dependency

Before this phase begins, the following must be provided:

- [ ] 41 story markdown files → `content/raw/stories_md/`
- [ ] Structured JSON per story → `content/raw/stories_json/`
- [ ] Core principles markdown → `content/raw/doctrine/`
- [ ] Heuristics doctrine → `content/raw/doctrine/`
- [ ] Story index with theme tagging → `content/raw/doctrine/`
- [ ] Timeline data → `content/raw/`
- [ ] Voice & personality model → `content/raw/voice/`

### Tasks

1. **Set up content directory structure**
   ```
   content/
   ├── raw/                          # Immutable source material
   │   ├── stories_md/               # 41 story markdown files (as-is)
   │   ├── stories_json/             # Structured JSON per story
   │   ├── doctrine/                 # core_principles.md, heuristics, story index
   │   └── voice/                    # 30_voice_style.md
   │
   └── wiki/                         # LLM-compiled (generated, committed to repo)
       ├── index.md                  # Master index
       ├── log.md                    # Append-only changelog
       ├── stories/                  # One page per story
       ├── principles/               # One page per principle
       ├── themes/                   # One page per theme
       ├── people/                   # One page per person
       ├── timeline/                 # One page per life stage/era
       └── heuristics/               # One page per heuristic
   ```

2. **Write wiki compilation script** (`scripts/compile-wiki.ts`)

   Uses **Claude Opus** for quality. Two-pass compilation:

   **Pass 1 — Generate all pages independently:**
   - Read each raw story + its structured JSON
   - Generate a wiki page per story: title, summary, full narrative, key quotes, principles, life stage, timeline placement
   - Generate a wiki page per principle: statement, description, theme
   - Generate a wiki page per theme: overview, which principles belong
   - Generate a wiki page per significant person: who they are, role in Keith's life
   - Generate a wiki page per life stage: era overview, key events
   - Generate a wiki page per heuristic: description, when to use
   - Generate **guided prompts** per story (for Young Reader mode): 2-3 tappable questions like "Why did Keith do that?" / "What did he learn?"
   - No cross-references yet — each page stands alone

   **Pass 2 — Add cross-references and backlinks:**
   - Claude reads ALL Pass 1 pages (or batched by category)
   - Adds `## Related Stories`, `## Related Principles`, `## See Also` sections to every page
   - Generates the master `index.md`: every page with one-line summary, organized by category
   - Generates `log.md` entry for the initial compilation
   - Validates: no orphan pages, no broken links

   **Wiki page format:**
   ```markdown
   # [Page Title]

   > One-sentence summary

   ## Overview
   [2-3 paragraph description]

   ## Key Points
   - [Bullet points of core content]

   ## Related Stories
   - [[story-slug]] — [why it's related]

   ## Related Principles
   - [[principle-slug]] — [connection]

   ## Quotes
   > "Quote text" — context

   ## Guided Prompts (Young Reader)
   - "Why did Keith do that?"
   - "What did he learn from this?"
   - "Tell me another story like this"

   ## See Also
   - [[theme-slug]]
   - [[person-slug]]

   ---
   *Sources: raw/stories_md/story-001.md, raw/stories_json/story-001.json*
   *Last compiled: [date]*
   ```

3. **Write wiki lint script** (`scripts/lint-wiki.ts`)
   - Uses Claude to scan for:
     - Contradictions between pages
     - Orphan pages (no inbound links)
     - Missing cross-references
     - Incomplete pages
     - Stale content
   - Outputs a report; optionally auto-fixes with human review
   - Run manually after compilation and periodically

4. **Write wiki parser utilities** (`src/lib/wiki/`)
   - `parseWikiPage(filePath)` — reads a wiki markdown file, extracts frontmatter-like sections (title, summary, related stories, quotes, guided prompts, etc.) into a typed object
   - `getWikiIndex()` — parses `index.md` into a structured catalog
   - `getAllStories()` — reads all `wiki/stories/*.md`, returns parsed objects
   - `getStoryBySlug(slug)` — reads a single story page
   - `getAllThemes()` — reads all `wiki/themes/*.md`
   - `getThemeBySlug(slug)` — reads a single theme page with its principles
   - `getTimelineByLifeStage()` — reads all `wiki/timeline/*.md`
   - These are used by Next.js server components to render pages at build/request time

5. **Run compilation and verify**
   - Compile wiki from raw content
   - Run lint script
   - Spot-check: read several wiki pages manually to verify quality
   - Commit compiled wiki to repo

### Deliverable
Complete, interlinked wiki in `content/wiki/`. Parser utilities ready for UI. Estimated compilation cost: ~$5-15 in Claude Opus API calls.

---

## Phase 3: Story Library, Story Detail, Home Screen

**Goal**: Users can browse, filter, and read stories. Home screen shows real content.

### Tasks

1. **Story Library page** (`/stories`)
   - Story card grid (title, summary, tags, life stage badge)
   - Filter sidebar/drawer:
     - Life stage filter (multi-select)
     - Theme/tag filter (multi-select)
     - Search input (filters by title + summary + body)
   - Sort options: chronological (default), alphabetical
   - Mobile: filters in a slide-out drawer
   - Client-side filtering (41 stories loaded at build time via wiki parser)

2. **Story Detail page** (`/stories/[slug]`)
   - Title + life stage badge
   - Full story text (rendered from markdown)
   - Key quotes (pulled out as styled blockquotes)
   - "What this story shows" — linked principles (from wiki cross-references)
   - "If you're thinking about..." — linked heuristics
   - Related stories (from wiki cross-references, max 3–4)
   - CTAs:
     - "Ask about this story" → links to `/ask?story=[slug]` (Teen/Adult)
     - "Show me another story like this" → scrolls to related stories
   - Young Reader: guided prompts instead of "Ask about this story"

3. **Age mode adjustments**
   - Young Reader: show summary only (truncated), one principle, large text, guided prompt buttons
   - Teen: full story, 1–2 principles
   - Adult: everything

4. **Home screen** (replace placeholder)
   - Brief intro text + optional photo
   - Three navigation cards with real counts ("41 Stories", "6 Themes", etc.)
   - Featured/random story highlight
   - Young Reader variant: simplified, larger cards, warmer language

### Deliverable
Fully functional story browsing and reading experience. Home screen with real content.

---

## Phase 4: Themes, Principles & Timeline

**Goal**: Users can explore themes, browse principles, and navigate the life timeline.

### Tasks

1. **Themes index page** (`/themes`)
   - Grid/list of theme cards
   - Each card: theme name, principle count, story count
   - Visual treatment: icons or colors per theme

2. **Theme detail page** (`/themes/[theme]`)
   - Theme name + description
   - Principles under this theme:
     - Principle statement
     - Supporting stories (linked)
     - Related quotes (styled)
     - Heuristics ("when to apply this")
   - Each story link goes to `/stories/[slug]`

3. **Timeline page** (`/timeline`)
   - Vertical timeline layout (mobile-friendly)
   - Grouped by life stage with clear section headers
   - Each event:
     - Title
     - Date/year range
     - Short description
     - Linked stories (clickable)
     - Linked quotes (if any)
   - Smooth scroll navigation (jump to life stage)
   - Responsive: works on narrow screens

4. **Cross-linking**
   - Story Detail pages link to themes
   - Theme pages link to stories
   - Timeline events link to stories
   - Bidirectional navigation feels natural

5. **Age mode adjustments**
   - Young Reader: simplified theme cards, simplified timeline descriptions, fewer events
   - Teen/Adult: full content

### Deliverable
Browseable themes/principles and visual timeline, all connected to the story library.

---

## Phase 5: Ask Keith (AI Conversation Layer)

**Goal**: Multi-turn AI conversations (Teen/Adult) and guided prompts (Young Reader), all grounded in wiki content.

### Tasks

1. **Claude API integration** (server-side only)
   - Install `@anthropic-ai/sdk`
   - Environment variable: `ANTHROPIC_API_KEY`
   - Use **Claude Sonnet** for all conversations
   - System prompt construction (`src/lib/ai/prompts.ts`):
     - Role: "You are a guide to Keith Cobb's stories and life lessons"
     - Rules: always ground in wiki content, cite story titles, never invent, admit uncertainty
     - Voice guidance loaded from `content/raw/voice/30_voice_style.md`
     - Age mode instructions based on active mode
     - Response format guidance (default Story→Lesson→Application for advice; direct answers for factual questions; curated lists for exploratory questions)
   - Pre-load wiki index + all page summaries into every prompt (~30K tokens)
     - Parsed from `content/wiki/index.md` + summary lines from each page
     - This IS the retrieval layer — no tool use, no embeddings

2. **Conversation management** (`src/lib/ai/conversation.ts`)
   - Context window management:
     - System prompt + wiki summaries: ~30K tokens (fixed)
     - Conversation history: variable, growing per turn
     - After N turns (configurable, ~10), summarize earlier messages into a single summary message
     - Max conversation length: 20 turns, then suggest starting fresh
   - Cost tracking:
     - Log input/output tokens per request
     - Alert at configurable monthly threshold

3. **Conversation API routes**
   - `POST /api/ask` — send message, get streamed response
     - Input: `{ conversationId?, message, storySlug? }`
     - Builds prompt: system + wiki summaries + conversation history + user message
     - If `storySlug` provided: include full story wiki page in context
     - Streams Claude Sonnet response back
     - Persists user message + assistant response to `messages` table
     - Extracts cited story slugs from response for linking
   - `GET /api/conversations` — list user's conversations
   - `GET /api/conversations/[id]` — get conversation with messages

4. **Teen/Adult chat UI** (`/ask`)
   - Conversation list (sidebar on desktop, separate view on mobile)
   - New conversation button
   - Chat interface:
     - Message input (text area)
     - Streaming response display
     - Story citations rendered as clickable links to `/stories/[slug]`
     - Scroll-to-bottom on new messages
   - Entry from Story Detail:
     - `/ask?story=[slug]` pre-loads story context
     - First system message: "I see you're reading [Story Title]. What would you like to explore about this story?"

5. **Young Reader guided prompt UI** (`/ask` in Young Reader mode)
   - **No free-text input** — tappable prompt buttons only
   - **From Home**: category picker with big illustrated cards
     - "A story about being brave"
     - "A story about family"
     - "A funny story"
     - "Tell me something about Keith"
   - **After a story**: 2-3 guided prompt buttons (loaded from wiki page's `## Guided Prompts` section)
     - "Why did Keith do that?"
     - "What did he learn?"
     - "Tell me another story like this"
   - Tapping a prompt sends it to the same Claude API endpoint
   - Response displayed in simple, large-text format (not a chat bubble UI)
   - Follow-up: 1-2 more prompts after the response, or "Read another story" button

6. **Guardrails**
   - Input validation: reject empty messages, cap length (Teen/Adult only — Young Reader uses pre-written prompts)
   - Fallback: "I don't have a story about that specifically, but here's what's closest..."
   - API unavailable fallback: "Ask Keith is temporarily unavailable. Try browsing stories by topic in the meantime." with link to Story Library
   - Rate limiting: reasonable per-user limits

### Deliverable
Working AI conversation experience for all age modes. Teen/Adult get free-text chat. Young Readers get guided, tappable prompts. All grounded in wiki content with streaming responses.

---

## Phase 6: Polish, Testing & Launch

**Goal**: Production-ready, tested, and deployed for the family.

### Tasks

1. **Cross-feature navigation**
   - Verify all links between stories, themes, timeline, and Ask Keith work
   - Breadcrumbs or back-navigation on all detail pages
   - Home screen featured/recent story pulls from real data

2. **Age mode end-to-end**
   - Test all three modes across all features
   - Verify toggle persists to profile
   - Verify Ask Keith uses correct mode in responses
   - Verify Young Reader guided prompts work for all stories
   - Test Young Reader home experience

3. **Mobile testing**
   - Test on actual phones (iOS Safari, Android Chrome)
   - Fix any touch/scroll/layout issues
   - Ensure chat interface works well on small screens
   - Ensure Young Reader tap targets are large enough

4. **Performance**
   - Audit with Lighthouse
   - Optimize images (if any)
   - Ensure story library loads fast (should be trivial at 41 stories)
   - Verify AI response streaming starts within 2s

5. **Security audit**
   - Verify all API keys are server-side only
   - Verify RLS policies work (test as different users)
   - Verify conversation privacy (users can't see each other's chats)
   - No content accessible without auth

6. **Invite family**
   - Create accounts for ~10 family members
   - Send invite emails with login instructions
   - Brief usage guide (optional — if the UI is good, it shouldn't need one)

### Deliverable
Live at `stories.cobbcorner.com`, family using it.

---

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (nav, auth wrapper, age mode provider)
│   ├── page.tsx                # Home screen
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts        # Supabase auth callback
│   ├── stories/
│   │   ├── page.tsx            # Story Library
│   │   └── [slug]/
│   │       └── page.tsx        # Story Detail
│   ├── themes/
│   │   ├── page.tsx            # Themes index
│   │   └── [theme]/
│   │       └── page.tsx        # Theme detail
│   ├── timeline/
│   │   └── page.tsx            # Timeline
│   ├── ask/
│   │   └── page.tsx            # Ask Keith (chat or guided prompts by age mode)
│   └── api/
│       ├── ask/
│       │   └── route.ts        # Claude conversation endpoint
│       └── conversations/
│           ├── route.ts        # List conversations
│           └── [id]/
│               └── route.ts    # Get conversation
├── components/
│   ├── layout/
│   │   ├── Nav.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── AgeModeSwitcher.tsx
│   ├── stories/
│   │   ├── StoryCard.tsx
│   │   ├── StoryFilters.tsx
│   │   ├── StoryContent.tsx
│   │   └── RelatedStories.tsx
│   ├── themes/
│   │   ├── ThemeCard.tsx
│   │   └── PrincipleBlock.tsx
│   ├── timeline/
│   │   ├── TimelineView.tsx
│   │   └── TimelineEvent.tsx
│   ├── ask/
│   │   ├── ChatInterface.tsx       # Teen/Adult free-text chat
│   │   ├── GuidedPrompts.tsx       # Young Reader tappable prompts
│   │   ├── MessageBubble.tsx
│   │   ├── ConversationList.tsx
│   │   └── StoryCitation.tsx
│   └── ui/
│       ├── Badge.tsx
│       ├── Card.tsx
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Skeleton.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── middleware.ts        # Auth middleware
│   ├── wiki/
│   │   ├── parser.ts           # Parse wiki markdown → typed objects
│   │   ├── stories.ts          # getAllStories(), getStoryBySlug()
│   │   ├── themes.ts           # getAllThemes(), getThemeBySlug()
│   │   ├── timeline.ts         # getTimelineByLifeStage()
│   │   ├── principles.ts       # getAllPrinciples()
│   │   └── index.ts            # getWikiIndex(), getWikiSummaries()
│   ├── ai/
│   │   ├── claude.ts           # Claude API client (Sonnet)
│   │   ├── prompts.ts          # System prompt construction
│   │   └── conversation.ts     # Context management, summarization, cost tracking
│   └── utils/
│       ├── age-mode.ts         # Age mode logic + context provider
│       └── markdown.ts         # Markdown rendering
├── hooks/
│   ├── useAgeMode.ts
│   ├── useAuth.ts
│   └── useChat.ts
├── types/
│   └── index.ts                # Shared TypeScript types
└── scripts/
    ├── compile-wiki.ts         # Two-pass wiki compilation (Claude Opus)
    └── lint-wiki.ts            # Wiki health check (Claude Opus)

content/
├── raw/                        # Immutable source material
│   ├── stories_md/             # 41 story markdown files
│   ├── stories_json/           # Structured JSON per story
│   ├── doctrine/               # Principles, heuristics, story index
│   └── voice/                  # Voice & personality model
└── wiki/                       # LLM-compiled knowledge base (committed to repo)
    ├── index.md                # Master index
    ├── log.md                  # Chronological changelog
    ├── stories/                # One page per story
    ├── principles/             # One page per principle
    ├── themes/                 # One page per theme
    ├── people/                 # One page per person
    ├── timeline/               # One page per life stage
    └── heuristics/             # One page per heuristic
```

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Wiki as single source of truth | Yes | Eliminates dual data pipelines. Content is readable, inspectable markdown. No Supabase content tables to keep in sync. |
| Supabase for auth + conversations only | Yes | 10 users, 41 stories — no need for a relational content layer. Supabase handles what files can't: auth state and user-generated data. |
| Wiki over RAG/pgvector | Wiki (Karpathy pattern) | Pre-compiled knowledge base with cross-references beats embedding similarity for a small, well-structured corpus. Simpler infrastructure, higher-quality retrieval, readable artifact. |
| Pre-load summaries instead of tool use | Yes | Corpus is small enough (~30K tokens of summaries) to include in every prompt. Eliminates tool-use latency and the streaming pause problem. |
| Two-pass wiki compilation | Yes | Pass 1 generates pages independently. Pass 2 adds cross-references with full knowledge of all pages. More coherent than single-pass. |
| Claude Sonnet for chat | Yes | Fast, cost-effective, good at grounded retrieval. Save Opus for compilation where quality matters more. |
| Claude Opus for wiki compilation | Yes | Compilation runs once (or on content updates). Quality of cross-references and summaries matters more than speed or cost. |
| Client-side filtering for stories | Yes | 41 stories is trivially small; avoids unnecessary server round-trips. |
| Streaming responses | Yes | Wiki context is large; streaming avoids long waits for users. |
| Markdown rendering | Client-side | Stories are markdown; render with `react-markdown` or similar. |
| Age mode in context | Provider pattern | React context wraps the app; all components can read active mode. |
| Conversation persistence | Supabase | Enables conversation history and continuation across sessions. |
| Conversation summarization | After ~10 turns | Prevents context window explosion in long conversations. Earlier messages compressed into a summary. |
| Young Reader: no free-text chat | Yes | 3–10 year olds can't effectively use a text input for AI conversation. Guided tappable prompts use the same backend but different UI. |
| Guided prompts pre-computed in wiki | Yes | Each story's wiki page includes a `## Guided Prompts` section generated during compilation. No runtime prompt generation needed. |
