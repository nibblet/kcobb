# Keith Cobb Interactive Storybook — Requirements Document

> **Domain**: stories.cobbcorner.com
> **Status**: V1 — Full Feature Set
> **Last Updated**: 2026-04-12

---

## 1. Product Summary

An interactive, private digital storybook and archive of Keith Cobb's life. Family members — especially grandchildren and great-grandchildren — can browse stories, explore themes and principles, view a life timeline, and have guided AI conversations grounded in real stories.

**Core framing**: Stories are primary. AI is secondary. This is a story library with a guided reflection layer, not a chatbot simulating a person.

---

## 2. Technical Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js (App Router) |
| **Language** | TypeScript |
| **UI** | React + Tailwind CSS |
| **Content** | Wiki markdown files (single source of truth) |
| **Database** | Supabase (PostgreSQL) — auth, profiles, conversations only |
| **Auth** | Supabase Auth (invite-only, private) |
| **AI (chat)** | Claude Sonnet (Anthropic) — conversations |
| **AI (compilation)** | Claude Opus (Anthropic) — wiki compilation & lint |
| **Hosting** | TBD (Vercel, Cloudflare, or similar) |
| **Design** | Mobile-first, responsive |

---

## 3. Users & Access

### 3.1 Access Model

- **Private**: family-only, behind Supabase Auth
- **Invite-based**: users are added by an admin (no self-registration)
- **User profile includes age** (used for age-appropriate content mode)

### 3.2 User Segments

| Segment | Age Range | Usage |
|---------|-----------|-------|
| Great-Grandchildren | 3–10 | Guided story journeys, tappable prompts, parent-assisted |
| Grandchildren | 14–31 | Explore stories, seek guidance, connect themes to real decisions |
| Adult Children | 50s | Reference archive, reflect on family history |
| Future Generations | — | Discover lineage and values |

### 3.3 Age Modes

Age mode is **user-selected** (toggle/dropdown) or **derived from the age field in their auth profile**. It affects UI structure, content language, and interaction patterns.

| Mode | Audience | Behavior |
|------|----------|----------|
| **Young Reader** (3–10) | Great-grandchildren | Guided story journeys with tappable prompts. Large text, simple language, one lesson per story. No free-text chat. Parent-assisted for ages 3–7. |
| **Teen** (11–17) | Teenage grandchildren | Full story library, themes, timeline. Ask Keith with free-text chat. Story + lesson, relatable examples, moderate detail. |
| **Adult** (18+) | Adult family members | All features, full detail. Multiple stories per response, deeper interpretation, nuanced application. |

---

## 4. Content Architecture

### 4.1 Single Source of Truth: The Wiki

All content lives in a **pre-compiled, interlinked markdown wiki** ([Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)). The wiki is:

- The data layer for the browseable UI (stories, themes, timeline)
- The knowledge base for Ask Keith (AI retrieval)
- A readable, inspectable artifact (no opaque database)

There is no separate database for content. Supabase stores only auth, user profiles, and conversation history.

### 4.2 Wiki Structure

```
content/
├── raw/                          # Immutable source material (never modified by scripts)
│   ├── stories_md/               # 41 story markdown files
│   ├── stories_json/             # Structured JSON per story (principles, heuristics, quotes)
│   ├── doctrine/                 # core_principles.md, heuristics doctrine, story index
│   └── voice/                    # 30_voice_style.md
│
└── wiki/                         # LLM-compiled knowledge base (generated, committed to repo)
    ├── index.md                  # Master index: every page with one-line summary
    ├── log.md                    # Append-only changelog
    ├── stories/                  # One page per story
    ├── principles/               # One page per principle
    ├── themes/                   # One page per browseable theme
    ├── people/                   # One page per significant person
    ├── timeline/                 # One page per life stage/era
    └── heuristics/               # One page per decision heuristic
```

### 4.3 Wiki Page Format

Each wiki page is a self-contained markdown file with:
- Title + one-sentence summary
- Overview (2–3 paragraphs)
- Key points (bullet list)
- Cross-references: related stories, principles, themes, people (as `[[wiki-links]]`)
- Quotes (if applicable)
- Source attribution (which raw files it was compiled from)
- Compilation date

### 4.4 Existing Assets (Pre-Wiki)

| Asset | Format | Count/Status |
|-------|--------|-------------|
| Memoir stories | Markdown (stories_md/) + plain text (stories_txt/) | 41 stories, multi-page length |
| Structured story data | JSON per story (principles, heuristics, quotes, context) | AI-generated, human-reviewed |
| Core principles | Markdown (core_principles.md) | Complete |
| Principles doctrine | Markdown (draft_principles_doctrine.md) | Draft |
| Heuristics doctrine | Markdown (draft_heuristics_doctrine.md) | Draft |
| Voice & personality model | Markdown (30_voice_style.md) | Complete |
| Story index | Markdown (00_STORY_INDEX.md) with theme tagging | Complete |
| Timeline data | Exists | TBD on format/detail |
| Quotes | In progress | Partial |

### 4.5 Database (Supabase — Minimal)

Supabase is used **only** for auth, profiles, and conversations. No content tables.

```
profiles (extends auth.users)
  - id (uuid, PK, FK → auth.users)
  - display_name (text)
  - age (integer, nullable)
  - age_mode (enum: young_reader | teen | adult, nullable — override)
  - role (enum: admin | member)
  - created_at
  - updated_at

conversations
  - id (uuid, PK)
  - user_id (FK → profiles)
  - title (text, nullable — auto-generated)
  - age_mode (enum — captured at conversation start)
  - created_at
  - updated_at

messages
  - id (uuid, PK)
  - conversation_id (FK → conversations)
  - role (enum: user | assistant)
  - content (text)
  - cited_story_slugs (text[], nullable)
  - created_at
```

**RLS Policies:**
- `profiles`: users can read/update their own profile
- `conversations` / `messages`: users can only access their own
- Admin role has full access

---

## 5. Features

### 5.1 Authentication & Onboarding

**Auth flow:**
1. Admin creates invite (email-based)
2. User receives invite link
3. User sets password, enters display name and age
4. User lands on Home Screen

**Session:**
- Persistent login (refresh tokens)
- Age mode derived from profile age, overridable via UI toggle

---

### 5.2 Home Screen

**Purpose**: Simple, warm entry point after login.

**Elements:**
- Brief intro: who Keith Cobb was (2–3 sentences + optional photo)
- Three navigation paths:
  - **"Read a Story"** → Story Library
  - **"Explore by Topic"** → Themes & Principles
  - **"Ask a Question"** → Ask Keith (Teen/Adult) or Story Journey (Young Reader)
- Age-mode selector (if not auto-derived)
- Recent or featured story highlight (optional)

**Young Reader Home**: Simplified — fewer options, larger tap targets, warmer language. "Want to hear a story about Keith?" with big illustrated cards for story categories.

---

### 5.3 Story Library

**Purpose**: Browse and discover stories.

**Browse/filter by:**
- Life stage (childhood, education, career phases, leadership, retirement)
- Theme/tag (work ethic, family, leadership, mentorship, gratitude, decision-making)
- People (if tagged)
- Search (full-text across title, summary, body)

**Story card display:**
- Title
- Short summary (2–3 sentences)
- Tags (as pills/chips)
- Life stage indicator

**Sorting:**
- Chronological (default, by life stage / sort_order)
- Alphabetical
- By theme

**Data source**: Parsed from `content/wiki/stories/` at build time.

---

### 5.4 Story Detail Page

**Purpose**: Read a story and understand its lessons.

**Components:**
- Title
- Life stage badge
- Summary (collapsible or above-the-fold)
- Full story text (markdown rendered)
- Key quotes (highlighted/pulled out)
- Related stories (by shared tags or principles)

**Below the story:**

> **What this story shows**
> - List of linked principles

> **If you're thinking about...**
> - Mapped heuristics / "best used when" guidance

**CTAs:**
- "Ask about this story" → opens Ask Keith with story context pre-loaded
- "Show me another story like this" → navigates to related stories

**Age mode adjustments:**
- Young Reader: shorter summary only, simplified language, one principle, larger text, guided prompts instead of "Ask about this story"
- Teen: full story, 1–2 principles, relatable framing
- Adult: full story, all principles/heuristics, deeper interpretation

**Data source**: Parsed from `content/wiki/stories/[slug].md` at build time.

---

### 5.5 Themes & Principles

**Purpose**: Browse the value system behind the stories.

**Top-level themes:**
- Integrity
- Work Ethic
- Leadership
- Mentorship
- Gratitude
- Decision-Making
- (additional as data supports)

**Theme detail page includes:**
- Principle statement
- Description/context
- Supporting stories (linked)
- Related quotes
- Related heuristics ("when to apply this")

**Data source**: Parsed from `content/wiki/themes/` and `content/wiki/principles/` at build time.

---

### 5.6 Timeline

**Purpose**: Chronological view of Keith Cobb's life.

**Structure:**
- Visual timeline (vertical, mobile-friendly)
- Grouped by life stage:
  - Childhood
  - Education
  - Early Career
  - Mid Career
  - Leadership Roles
  - Retirement

**Each event shows:**
- Title
- Date/year range
- Short description
- Links to related stories
- Links to related quotes

**Data source**: Parsed from `content/wiki/timeline/` at build time.

---

### 5.7 Ask Keith (AI Conversation Layer)

**Purpose**: Guided, story-grounded conversations about life lessons.

#### 5.7.1 Behavior

- Multi-turn conversational (Teen/Adult modes)
- Guided prompts only (Young Reader mode)
- Conversation history persisted per user
- Users can start new conversations or continue previous ones

#### 5.7.2 Response Pattern (Default, Not Rigid)

For **advice/guidance questions**, follow:
```
Story → Lesson → Application
```
1. Identify the most relevant story (or stories)
2. Briefly reference/summarize the story
3. Extract the principle or lesson
4. Apply it to the user's situation or question

For **factual questions**: answer directly with story citations.
For **exploratory questions**: suggest relevant stories with brief context.
For **lists/browsing**: return a curated list with summaries.

#### 5.7.3 Knowledge Sources (Priority Order)

1. Stories (primary — always ground in these)
2. Principles
3. Heuristics
4. Quotes
5. Timeline context

#### 5.7.4 Retrieval Architecture — Wiki Pattern

Based on [Karpathy's LLM Wiki approach](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f): pre-compile all content into an interlinked markdown knowledge base. No embeddings, no vector database.

**Retrieval method**: Pre-load wiki index + all page summaries into every prompt (~30K tokens). Claude picks what's relevant from what's already in context. No tool use needed — the context IS the retrieval layer.

**Query flow:**
```
User question
→ System prompt (role, rules, voice, age mode)
→ Wiki index + all page summaries (pre-loaded)
→ Conversation history (with summarization for long conversations)
→ Claude Sonnet generates response grounded in wiki content
→ Response includes story citations as links
```

**Living document (V2):**
- New content triggers wiki re-compilation
- Periodic lint passes check for contradictions, orphan pages, missing links
- `log.md` tracks all changes chronologically

#### 5.7.5 Response Rules

- **Always grounded**: every substantive claim references a story or principle
- **No invention**: never fabricate stories, quotes, or events
- **Cite sources**: reference story titles (linked) when possible
- **Admit uncertainty**: "I don't have a story about that specifically, but here's what's closest..."
- **Age-appropriate**: adjust language and depth based on active age mode
- **Guardrails**: deflect obviously inappropriate queries; otherwise be open and helpful

#### 5.7.6 Age Mode in Ask Keith

| Mode | Interface | Response Style |
|------|-----------|---------------|
| Young Reader | **Guided prompts only** — tappable questions after stories, category-based story suggestions. No free-text input. | Simple language, short answers, one story, one clear lesson. |
| Teen | Free-text chat | Story + lesson, relatable examples, moderate depth |
| Adult | Free-text chat | Multiple stories, deeper interpretation, nuanced application |

**Young Reader guided prompts** (pre-computed during wiki compilation, stored per story):
- After a story: "Why did Keith do that?" / "What did he learn?" / "Tell me another story like this"
- From home: "A story about being brave" / "A story about family" / "A funny story"
- These feed pre-written questions to the same Claude backend — same API, different UI

#### 5.7.7 Entry Points

- **Home Screen**: "Ask a Question" → new conversation (Teen/Adult) or story category picker (Young Reader)
- **Story Detail**: "Ask about this story" → new conversation with story context pre-loaded (Teen/Adult) or guided prompts (Young Reader)
- **Navigation**: conversation history list with ability to continue or start new

#### 5.7.8 Conversation Management

- **Model**: Claude Sonnet (fast, cost-effective for grounded retrieval)
- **Context management**: after N turns, summarize earlier messages to stay within token budget
- **Max conversation length**: 20 turns, then suggest starting a new one
- **Monthly cost budget**: track API spend, alert at threshold
- **Fallback**: if Claude API is unavailable, show message: "Ask Keith is temporarily unavailable. Try browsing stories by topic in the meantime."

---

## 6. Design Principles

1. **Story-first, not AI-first** — the stories are the product; AI helps you navigate them
2. **Authenticity over completeness** — better to say "I don't know" than to guess
3. **Simplicity over features** — every screen should be obvious on first use
4. **Evidence over opinion** — everything traces back to a real story or quote
5. **Warmth over cleverness** — this is a family archive, not a tech demo

---

## 7. Non-Functional Requirements

### 7.1 Performance

- Page loads < 2s on mobile (LCP)
- AI responses begin streaming within 2s
- Story library filtering is instant (client-side after initial load for 41 stories)

### 7.2 Security

- All routes behind Supabase Auth (no public access to content)
- Row-level security (RLS) on Supabase tables (profiles, conversations, messages)
- API keys server-side only (Next.js API routes / server components)
- Claude API calls made server-side only

### 7.3 Accessibility

- WCAG 2.1 AA minimum
- Keyboard navigable
- Screen reader friendly
- Sufficient contrast ratios (especially in Young Reader mode with larger text)

### 7.4 Data Privacy

- No analytics tracking without consent
- Conversation history visible only to the user who created it
- Admin can see aggregate usage but not conversation content

### 7.5 Cost Management

- **Claude Sonnet** for all conversations (~$3/M input, ~$15/M output tokens)
- **Claude Opus** for wiki compilation and lint only (offline, one-time or periodic)
- Estimated monthly cost for 10 active users: $20–50/month
- Monitor API spend; alert at configurable threshold

---

## 8. Admin Capabilities (Lightweight)

V1 admin is the person managing the system (you). No admin UI needed — management via Supabase dashboard + CLI scripts.

- **Invite users**: create auth invites via Supabase dashboard
- **Manage content**: edit wiki files, re-run compilation scripts
- **View users**: Supabase dashboard
- **Future (V2)**: Keith adds stories via a submission form → triggers wiki re-compilation

---

## 9. Success Criteria

### Engagement
- Users browse multiple stories per session
- "Show me another story like this" is used frequently
- Users return to Ask Keith for multiple conversations

### Trust
- AI answers always reference real stories
- Zero hallucinated content reported by family

### Emotional Impact
- Users feel connected to the stories
- Content is shared/discussed within the family

---

## 10. Future Roadmap (Post-V1)

### V2
- Keith adds stories via a submission form (triggers wiki re-compilation)
- Quote cards (shareable images)
- Guided "story journeys" (curated paths through related stories)
- Theme collections
- Media room (video + audio transcripts)
- Automated wiki lint on schedule

### V3
- Audio narration of stories
- "Tell me a story" voice mode
- Family member contributions (other family members add memories)
- Favorites / saved stories
- Bookmarks within conversations
