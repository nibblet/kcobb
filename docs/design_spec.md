# Keith Cobb Storybook — Full Design Specification
**"Out of the Red Clay Hills"**  
Version 1.0 | Based on book cover palette + living-legacy design philosophy

---

## 1. Design Philosophy

### Core Principle: Living Legacy, Not Archived History
This site honors a life *actively being celebrated* — not a museum exhibit. Keith Cobb is alive, his stories are present tense to his family, and the design must reflect that. The book dust jacket already defines the right tone: vibrant oil-painting blues, lush Mississippi greens, deep burgundy authority, warm parchment ground. No sepia. No faded edges. No "aged" treatments.

### Three Design Pillars

| Pillar | What it means |
|--------|---------------|
| **Warm & Present** | Colors pulled from the actual book cover — lush, vital, alive |
| **Quietly Editorial** | Typography and layout borrowed from quality long-form journalism (NYT, The New Yorker, Longreads) |
| **Earned Simplicity** | Nothing decorative that doesn't serve the story. Whitespace is intentional, not lazy |

### Visual Source of Truth
Always refer back to the dust jacket:
- Front cover: Deep burgundy title on warm parchment
- Portrait painting: Coastal blues, warm skin, confident expression
- Back cover: Red clay road, lush green Mississippi fields, golden horizon light
- Spine: Warm cream, bookish serif type

---

## 2. Color System

### Primary Palette — CSS Variables

```css
:root {
  /* --- BRAND CORE --- */
  --color-burgundy:        #8B2C2C;   /* Title treatment, primary brand */
  --color-burgundy-dark:   #6B1E1E;   /* Hover on burgundy elements */
  --color-burgundy-light:  #F5E8E8;   /* Burgundy tinted backgrounds */

  /* --- RED CLAY --- */
  --color-clay:            #B5451B;   /* Primary CTA, active nav, buttons */
  --color-clay-mid:        #C8662A;   /* Button hover state */
  --color-clay-light:      #FDF0E8;   /* Tag fills, card accents */
  --color-clay-border:     #E8B090;   /* Clay-toned borders */

  /* --- WARM NEUTRALS (from parchment background) --- */
  --color-parchment:       #F0E8D5;   /* Page background — subtle warmth */
  --color-warm-white:      #F7F3ED;   /* Card and panel backgrounds */
  --color-warm-white-2:    #FBF8F4;   /* Elevated surfaces (modals, dropdowns) */
  --color-ink:             #2C1C10;   /* Body text — warm dark, not cold black */
  --color-ink-muted:       #6B5040;   /* Secondary text, captions */
  --color-ink-ghost:       #A89070;   /* Tertiary text, placeholders */

  /* --- OCEAN BLUE (from Barbara Castell portrait) --- */
  --color-ocean:           #4A7FA0;   /* Links, interactive elements */
  --color-ocean-light:     #7AB3C9;   /* Tag fills, info badges */
  --color-ocean-pale:      #E8F4F8;   /* Info background tints */

  /* --- MISSISSIPPI GREEN (from back cover landscape) --- */
  --color-green:           #3D6B35;   /* Success states, "read" indicators */
  --color-green-mid:       #6BA35A;   /* Theme tags */
  --color-green-pale:      #EEF4EC;   /* Light tag/badge fills */

  /* --- HORIZON GOLD (from landscape light) --- */
  --color-gold:            #D4A843;   /* Featured badge, star ratings */
  --color-gold-pale:       #F5E8C8;   /* Highlight backgrounds */

  /* --- BORDERS & SURFACES --- */
  --color-border:          rgba(44, 28, 16, 0.12);   /* Default borders */
  --color-border-strong:   rgba(44, 28, 16, 0.25);   /* Emphasized borders */
  --color-divider:         rgba(44, 28, 16, 0.08);   /* Subtle dividers */
}
```

### Semantic Color Assignments

| Element | Color Token | Hex |
|---------|-------------|-----|
| Page background | `--color-parchment` | `#F0E8D5` |
| Card / panel background | `--color-warm-white` | `#F7F3ED` |
| Modal / elevated surface | `--color-warm-white-2` | `#FBF8F4` |
| Primary headline | `--color-burgundy` | `#8B2C2C` |
| Body text | `--color-ink` | `#2C1C10` |
| Secondary / caption text | `--color-ink-muted` | `#6B5040` |
| Placeholder / tertiary | `--color-ink-ghost` | `#A89070` |
| Primary button | `--color-clay` | `#B5451B` |
| Button hover | `--color-clay-mid` | `#C8662A` |
| Links | `--color-ocean` | `#4A7FA0` |
| Active nav item | `--color-burgundy` | `#8B2C2C` |
| Tag: Era (1950s, etc.) | `--color-clay-light` + `--color-clay` text | |
| Tag: Theme (Faith, Family) | `--color-green-pale` + `--color-green` text | |
| Tag: Leadership | `--color-ocean-pale` + `--color-ocean` text | |
| Featured badge | `--color-gold-pale` + `--color-gold` text | |
| Success / completed | `--color-green` | `#3D6B35` |
| Borders (default) | `--color-border` | `rgba(44,28,16,0.12)` |

### Era Color Coding (for Timeline & Cards)

Each life chapter gets its own accent — used consistently on era badges and timeline nodes:

| Era | Years | Color | Hex |
|-----|-------|-------|-----|
| Red Clay Hills | 1935–1955 | Warm Burgundy | `#8B2C2C` |
| Coming of Age | 1956–1968 | Clay | `#B5451B` |
| Building | 1969–1980 | Horizon Gold | `#D4A843` |
| Leadership | 1981–1998 | Ocean Blue | `#4A7FA0` |
| Legacy | 1999–2015 | Mississippi Green | `#3D6B35` |

---

## 3. Typography

### Font Stack

```css
/* Display / Headlines — the "book voice" */
--font-display: 'Playfair Display', 'Georgia', serif;

/* Body / Reading — warm, legible editorial */
--font-body: 'Lora', 'Times New Roman', serif;

/* UI / Navigation — clean, modern contrast */
--font-ui: 'Inter', 'Helvetica Neue', sans-serif;

/* Metadata / Tags / Captions — small, readable */
--font-meta: 'Inter', 'Helvetica Neue', sans-serif;
```

**Why these fonts:**
- `Playfair Display` — editorial authority, matches the book's serif title treatment
- `Lora` — excellent reading experience at body size, warm letterforms suited to memoir content
- `Inter` — clean contrast for nav/UI chrome without competing with the story content

**Google Fonts import:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lora:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

### Type Scale

```css
/* --- DISPLAY (homepage hero, chapter openers) --- */
.type-hero {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-burgundy);
  letter-spacing: -0.02em;
}

/* --- PAGE TITLE --- */
.type-page-title {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 600;
  line-height: 1.2;
  color: var(--color-burgundy);
}

/* --- STORY HEADLINE (on cards and story pages) --- */
.type-story-title {
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 2vw, 1.75rem);
  font-weight: 600;
  line-height: 1.25;
  color: var(--color-ink);
}

/* --- PULL QUOTE --- */
.type-pullquote {
  font-family: var(--font-display);
  font-style: italic;
  font-size: clamp(1.1rem, 1.8vw, 1.4rem);
  font-weight: 400;
  line-height: 1.45;
  color: var(--color-burgundy);
}

/* --- BODY TEXT (story reading) --- */
.type-body {
  font-family: var(--font-body);
  font-size: 1.125rem;  /* 18px — generous for reading */
  font-weight: 400;
  line-height: 1.8;
  color: var(--color-ink);
}

/* --- UI LABEL / NAV --- */
.type-ui {
  font-family: var(--font-ui);
  font-size: 0.875rem;  /* 14px */
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--color-ink);
}

/* --- CAPTION / META --- */
.type-meta {
  font-family: var(--font-meta);
  font-size: 0.75rem;  /* 12px */
  font-weight: 400;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-ink-ghost);
}

/* --- ERA LABEL (above story titles) --- */
.type-era-label {
  font-family: var(--font-meta);
  font-size: 0.6875rem;  /* 11px */
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
```

### Drop Cap (story page opener)

```css
.story-body > p:first-of-type::first-letter {
  font-family: var(--font-display);
  font-size: 4.5rem;
  font-weight: 700;
  color: var(--color-burgundy);
  float: left;
  line-height: 0.75;
  margin: 0.1em 0.08em 0 0;
  padding: 0;
}
```

---

## 4. Spacing & Layout

### Spacing Scale

```css
--space-1:  0.25rem;   /*  4px */
--space-2:  0.5rem;    /*  8px */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-5:  1.25rem;   /* 20px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
--space-24: 6rem;      /* 96px */
```

### Layout Grid

```css
/* Content column widths */
--width-story:   680px;   /* Story reading column — optimal line length */
--width-content: 800px;   /* Standard content (cards, timeline) */
--width-wide:    1100px;  /* Full-width sections (hero, gallery) */
--width-max:     1280px;  /* Page container max */

/* Horizontal padding (inside page container) */
--page-padding-x: clamp(1rem, 4vw, 3rem);
```

### Border Radius Scale

```css
--radius-sm:   4px;    /* Tags, badges, chips */
--radius-md:   8px;    /* Buttons, inputs, small cards */
--radius-lg:   12px;   /* Standard cards */
--radius-xl:   16px;   /* Large panels */
--radius-full: 9999px; /* Pills */
```

---

## 5. Component Library

### 5.1 Navigation Bar

**Behavior:** Transparent over hero → warm white on scroll (crossfade at 60px scroll)

```css
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 60px;
  padding: 0 var(--page-padding-x);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-warm-white);
  border-bottom: 0.5px solid var(--color-border);
  backdrop-filter: blur(8px);
  background: rgba(247, 243, 237, 0.92);
}

.nav-brand {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-burgundy);
  letter-spacing: -0.01em;
}

.nav-links {
  display: flex;
  gap: var(--space-8);
  list-style: none;
}

.nav-link {
  font-family: var(--font-ui);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-ink-muted);
  text-decoration: none;
  transition: color 0.15s;
}

.nav-link:hover  { color: var(--color-ink); }
.nav-link.active { color: var(--color-burgundy); }

/* Active indicator — thin burgundy underline */
.nav-link.active::after {
  content: '';
  display: block;
  height: 2px;
  background: var(--color-burgundy);
  border-radius: 1px;
  margin-top: 2px;
}
```

**Age Mode Toggle (in nav, mobile-friendly):**

```css
.age-toggle {
  display: flex;
  border: 0.5px solid var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
  background: var(--color-warm-white);
}

.age-toggle-btn {
  padding: 4px 12px;
  font-size: 0.75rem;
  font-weight: 500;
  font-family: var(--font-ui);
  color: var(--color-ink-muted);
  cursor: pointer;
  border: none;
  background: transparent;
  transition: background 0.15s, color 0.15s;
}

.age-toggle-btn.active {
  background: var(--color-ink);
  color: var(--color-warm-white);
  border-radius: var(--radius-full);
}
```

---

### 5.2 Hero / Homepage Banner

**Structure:** Full-width section with back cover landscape photo as a background

```css
.hero {
  position: relative;
  min-height: 85vh;
  display: flex;
  align-items: center;
  overflow: hidden;
  background: var(--color-ink);  /* fallback */
}

.hero-bg {
  position: absolute;
  inset: 0;
  background-image: url('/images/red-clay-road.jpg');
  background-size: cover;
  background-position: center 30%;
  /* Subtle parallax via JS scroll handler: transform: translateY(scrollY * 0.3px) */
}

/* Gradient overlay — warm bottom-up fade for text legibility */
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(44, 28, 16, 0.85) 0%,
    rgba(44, 28, 16, 0.4)  40%,
    rgba(44, 28, 16, 0.1)  100%
  );
}

.hero-content {
  position: relative;
  z-index: 10;
  max-width: var(--width-wide);
  margin: 0 auto;
  padding: var(--space-24) var(--page-padding-x) var(--space-20);
  text-align: center;
}

.hero-era-label {
  font-family: var(--font-meta);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-ink-ghost);
  margin-bottom: var(--space-4);
  /* Scroll reveal: fade in from below on load */
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(3rem, 6vw, 5.5rem);
  font-weight: 700;
  line-height: 1.05;
  color: #F0E8D5;  /* parchment on dark bg */
  letter-spacing: -0.02em;
  margin-bottom: var(--space-5);
}

.hero-subtitle {
  font-family: var(--font-body);
  font-style: italic;
  font-size: clamp(1rem, 1.5vw, 1.25rem);
  color: rgba(240, 232, 213, 0.75);
  max-width: 520px;
  margin: 0 auto var(--space-10);
  line-height: 1.55;
}

.hero-pull-quote {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1rem;
  color: var(--color-ink-ghost);
  max-width: 400px;
  margin: 0 auto var(--space-10);
  border-top: 0.5px solid rgba(240, 232, 213, 0.2);
  padding-top: var(--space-6);
}

.hero-scroll-cue {
  position: absolute;
  bottom: var(--space-8);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  color: rgba(240, 232, 213, 0.5);
  font-size: 0.6875rem;
  font-family: var(--font-meta);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  animation: bounceDown 2s ease-in-out infinite;
}

@keyframes bounceDown {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50%       { transform: translateX(-50%) translateY(6px); }
}
```

---

### 5.3 Story Cards

Two variants: **Featured** (large, with cover image area) and **Standard** (compact list)

**Featured Card:**
```css
.story-card-featured {
  background: var(--color-warm-white);
  border: 0.5px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.story-card-featured:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(44, 28, 16, 0.1);
}

.story-card-image {
  aspect-ratio: 16/7;
  background: linear-gradient(135deg, #6B4C2A, #9C6B3A);  /* fallback */
  overflow: hidden;
  position: relative;
}

.story-card-image img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}

.story-card-featured:hover .story-card-image img {
  transform: scale(1.03);
}

.story-card-body { padding: var(--space-6) var(--space-6) var(--space-6); }

.story-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.story-card-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-ink);
  margin-bottom: var(--space-2);
}

.story-card-excerpt {
  font-family: var(--font-body);
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-ink-muted);
  margin-bottom: var(--space-4);
  /* Max 2 lines */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.story-card-meta {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-family: var(--font-ui);
  font-size: 0.75rem;
  color: var(--color-ink-ghost);
}
```

**Standard Card (list/grid):**
```css
.story-card {
  background: var(--color-warm-white);
  border: 0.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.story-card:hover {
  border-color: var(--color-border-strong);
  background: var(--color-warm-white-2);
}

/* Left accent on hover — clay stripe */
.story-card::before {
  content: '';
  position: absolute;
  left: 0; top: 12px; bottom: 12px;
  width: 3px;
  background: var(--color-clay);
  border-radius: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}
.story-card:hover::before { opacity: 1; }
```

---

### 5.4 Tags & Badges

```css
/* Base tag */
.tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-family: var(--font-ui);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

/* Era tags */
.tag-era-1  { background: var(--color-burgundy-light); color: var(--color-burgundy-dark); }
.tag-era-2  { background: var(--color-clay-light);     color: #7A2E0E; }
.tag-era-3  { background: var(--color-gold-pale);      color: #7A5A10; }
.tag-era-4  { background: var(--color-ocean-pale);     color: #1F5470; }
.tag-era-5  { background: var(--color-green-pale);     color: #2A4D22; }

/* Theme tags */
.tag-faith      { background: var(--color-gold-pale);  color: #7A5A10; }
.tag-family     { background: var(--color-clay-light); color: #7A2E0E; }
.tag-leadership { background: var(--color-ocean-pale); color: #1F5470; }
.tag-work       { background: var(--color-green-pale); color: #2A4D22; }
.tag-humor      { background: #FFF0E8;                 color: #8B4B1B; }
.tag-hardship   { background: #F5EEF5;                 color: #5C3470; }

/* Featured badge */
.badge-featured {
  background: var(--color-gold-pale);
  color: #7A5A10;
  border: 0.5px solid #D4A843;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Age mode badges */
.badge-age-young { background: #E8F4E8; color: #2A4D22; }
.badge-age-teen  { background: #E8F0F8; color: #1F3D5C; }
.badge-age-adult { background: var(--color-burgundy-light); color: var(--color-burgundy-dark); }
```

---

### 5.5 Buttons

```css
/* Primary — Clay/CTA */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px 22px;
  background: var(--color-clay);
  color: #FDF8F4;
  font-family: var(--font-ui);
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  text-decoration: none;
}
.btn-primary:hover  { background: var(--color-clay-mid); }
.btn-primary:active { transform: scale(0.98); }

/* Secondary — Outlined */
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 9px 20px;
  background: transparent;
  color: var(--color-ink);
  font-family: var(--font-ui);
  font-size: 0.875rem;
  font-weight: 500;
  border: 0.5px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  text-decoration: none;
}
.btn-secondary:hover {
  background: rgba(44, 28, 16, 0.05);
  border-color: var(--color-ink-ghost);
}

/* Ghost link button */
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 6px 0;
  background: transparent;
  color: var(--color-ocean);
  font-family: var(--font-ui);
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.15s;
}
.btn-ghost:hover { color: var(--color-burgundy); }
```

---

### 5.6 Story Reading Page

This is the highest-priority layout — the experience of actually reading a story.

```css
/* Page wrapper */
.story-page {
  background: var(--color-warm-white);
  min-height: 100vh;
}

/* Reading progress bar — fixed at top */
.reading-progress {
  position: fixed;
  top: 60px;  /* below nav */
  left: 0;
  height: 2px;
  background: var(--color-clay);
  border-radius: 0 1px 1px 0;
  z-index: 50;
  transition: width 0.1s linear;
  /* width set by JS: (scrollY / (docHeight - viewportHeight)) * 100% */
}

/* Story header */
.story-header {
  max-width: var(--width-story);
  margin: 0 auto;
  padding: var(--space-16) var(--page-padding-x) var(--space-10);
}

.story-header-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
}

.story-chapter-num {
  font-family: var(--font-meta);
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-ink-ghost);
}

.story-title {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  line-height: 1.15;
  color: var(--color-ink);
  margin-bottom: var(--space-5);
}

.story-reading-meta {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  color: var(--color-ink-ghost);
  padding-top: var(--space-4);
  border-top: 0.5px solid var(--color-divider);
}

/* Story body */
.story-body {
  max-width: var(--width-story);
  margin: 0 auto;
  padding: 0 var(--page-padding-x);
}

.story-body p {
  font-family: var(--font-body);
  font-size: 1.125rem;
  line-height: 1.8;
  color: var(--color-ink);
  margin-bottom: 1.5em;
}

/* Pull quote */
.story-pullquote {
  margin: var(--space-10) 0;
  padding: var(--space-6) var(--space-8);
  border-left: 3px solid var(--color-burgundy);
  background: var(--color-burgundy-light);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.story-pullquote p {
  font-family: var(--font-display) !important;
  font-style: italic;
  font-size: 1.25rem !important;
  line-height: 1.5 !important;
  color: var(--color-burgundy) !important;
  margin: 0 !important;
}

/* Story footer — next steps */
.story-footer {
  max-width: var(--width-story);
  margin: var(--space-16) auto var(--space-24);
  padding: var(--space-10) var(--page-padding-x) 0;
  border-top: 0.5px solid var(--color-divider);
}

.story-footer-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-bottom: var(--space-10);
}
```

---

### 5.7 Timeline Page

```css
/* Timeline container */
.timeline {
  max-width: var(--width-content);
  margin: 0 auto;
  padding: var(--space-12) var(--page-padding-x);
}

/* Era section */
.timeline-era {
  display: flex;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

/* Left column: dot + line */
.timeline-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 4px;
  width: 24px;
  flex-shrink: 0;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid white;
  box-shadow: 0 0 0 2px currentColor;
}

.timeline-line {
  flex: 1;
  width: 1px;
  background: var(--color-border);
  margin-top: 6px;
}

/* Era content */
.timeline-content {
  flex: 1;
  cursor: pointer;
}

.timeline-era-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.timeline-era-year {
  font-family: var(--font-meta);
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-ghost);
}

.timeline-era-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-ink);
  margin-bottom: var(--space-1);
}

.timeline-era-desc {
  font-family: var(--font-body);
  font-size: 0.9375rem;
  color: var(--color-ink-muted);
  line-height: 1.6;
}

/* Story nodes inside an expanded era */
.timeline-stories {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-3);
  margin-top: var(--space-4);
  /* Animated expand: max-height transition */
  overflow: hidden;
  transition: max-height 0.35s ease;
}
```

---

### 5.8 "Ask Keith" Chat Interface

**Design intent:** Intimate, like sitting in a chair across from someone. Warm, unhurried.

```css
/* Page layout */
.ask-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  max-width: 720px;
  margin: 0 auto;
  padding: 0 var(--page-padding-x);
}

/* Keith intro header */
.ask-header {
  padding: var(--space-8) 0 var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  border-bottom: 0.5px solid var(--color-divider);
}

.ask-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--color-clay-light);
  border: 2px solid var(--color-clay-border);
  overflow: hidden;
  flex-shrink: 0;
}

.ask-header-text h2 {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-ink);
  margin-bottom: 2px;
}

.ask-header-text p {
  font-family: var(--font-body);
  font-style: italic;
  font-size: 0.875rem;
  color: var(--color-ink-muted);
}

/* Chat messages area */
.ask-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6) 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* Message bubble — Keith's responses */
.ask-message-keith {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  max-width: 90%;
}

.ask-message-keith .bubble {
  background: var(--color-warm-white-2);
  border: 0.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  border-top-left-radius: var(--radius-sm);
  padding: var(--space-4) var(--space-5);
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.7;
  color: var(--color-ink);
}

/* Source citation inside response */
.ask-source-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-ui);
  font-size: 0.75rem;
  color: var(--color-ocean);
  margin-top: var(--space-2);
  text-decoration: none;
  border-bottom: 0.5px solid var(--color-ocean);
}

/* User message bubble */
.ask-message-user {
  align-self: flex-end;
  max-width: 75%;
}

.ask-message-user .bubble {
  background: var(--color-clay);
  color: #FDF8F4;
  border-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-5);
  font-family: var(--font-ui);
  font-size: 0.9375rem;
  line-height: 1.5;
}

/* Suggested questions */
.ask-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-4) 0;
  border-top: 0.5px solid var(--color-divider);
}

.ask-suggestion-chip {
  padding: 7px 14px;
  border: 0.5px solid var(--color-clay-border);
  border-radius: var(--radius-full);
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  color: var(--color-clay);
  background: var(--color-clay-light);
  cursor: pointer;
  transition: background 0.15s;
}
.ask-suggestion-chip:hover {
  background: #F5D8C0;
}

/* Input area */
.ask-input-row {
  padding: var(--space-4) 0 var(--space-6);
  display: flex;
  gap: var(--space-3);
}

.ask-input {
  flex: 1;
  padding: 10px 16px;
  background: var(--color-warm-white);
  border: 0.5px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  font-family: var(--font-ui);
  font-size: 0.9375rem;
  color: var(--color-ink);
  outline: none;
  transition: border-color 0.15s;
}
.ask-input:focus {
  border-color: var(--color-clay-border);
  box-shadow: 0 0 0 3px rgba(181, 69, 27, 0.08);
}
.ask-input::placeholder { color: var(--color-ink-ghost); }
```

---

### 5.9 Search & Filter

```css
/* Search bar */
.search-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 16px;
  background: var(--color-warm-white);
  border: 0.5px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  transition: border-color 0.15s, box-shadow 0.15s;
  max-width: 560px;
}
.search-bar:focus-within {
  border-color: var(--color-clay-border);
  box-shadow: 0 0 0 3px rgba(181, 69, 27, 0.08);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-family: var(--font-ui);
  font-size: 0.9375rem;
  color: var(--color-ink);
  outline: none;
}

/* Search result item */
.search-result {
  padding: var(--space-4) 0;
  border-bottom: 0.5px solid var(--color-divider);
  cursor: pointer;
}

.search-result-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-ink);
  margin-bottom: var(--space-1);
}

.search-result-excerpt {
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--color-ink-muted);
  line-height: 1.6;
}

/* Highlighted match */
.search-highlight {
  background: var(--color-gold-pale);
  color: var(--color-ink);
  padding: 0 2px;
  border-radius: 2px;
}
```

---

## 6. Age Mode System

Three reading modes that adjust language complexity, typography, and UI density.

### Mode Definitions

| Mode | Audience | Body Font Size | Line Height | Card Density | Language |
|------|----------|---------------|-------------|--------------|----------|
| Young Reader | Ages 6–11 | 1.25rem | 2.0 | 1 column, large | Simplified AI rewrite |
| Teen | Ages 12–17 | 1.125rem | 1.85 | 2 columns | Near-full text |
| Adult | 18+ | 1.125rem | 1.8 | 3 columns | Original text |

### CSS Mode Classes (applied to `<html>` or `<body>`)

```css
/* Young Reader overrides */
body.mode-young {
  --story-font-size: 1.25rem;
  --story-line-height: 2.0;
  --card-columns: 1;
  --hero-font-size-multiplier: 1.2;
}

body.mode-young .story-body p {
  font-size: var(--story-font-size);
  line-height: var(--story-line-height);
}

body.mode-young .nav-links .link-themes { display: none; }  /* hide complexity */

/* Teen overrides */
body.mode-teen {
  --story-font-size: 1.0625rem;
  --story-line-height: 1.85;
  --card-columns: 2;
}

/* Adult — default, no overrides needed */
```

### UX Behavior
- Mode persists in `localStorage`
- Changing mode re-fetches story content (AI rewrites for Young/Teen)
- Visual transition: 150ms cross-fade on mode switch, NOT a jarring snap
- Badge in nav corner indicates active mode at all times

---

## 7. Motion & Animation

### Principles
- **Purposeful only** — motion serves navigation and comprehension, not decoration
- **Respect prefers-reduced-motion** — all animations are disabled for users who opt out
- **Story-appropriate pacing** — slower, more deliberate than typical SaaS apps

### Transition Defaults

```css
/* Standard timing functions */
--ease-out-soft:   cubic-bezier(0.25, 1, 0.5, 1);
--ease-in-out-md:  cubic-bezier(0.45, 0, 0.55, 1);

/* Durations */
--duration-fast:   100ms;   /* Hover states, micro-interactions */
--duration-normal: 200ms;   /* Buttons, toggles, nav */
--duration-slow:   350ms;   /* Cards, panels, reveals */
--duration-xslow:  500ms;   /* Page transitions, hero animations */
```

### Scroll Reveal (Intersection Observer)

```css
/* Elements that fade up on scroll into view */
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity var(--duration-slow) var(--ease-out-soft),
              transform var(--duration-slow) var(--ease-out-soft);
}

.reveal.in-view {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger delays for card grids */
.reveal:nth-child(2) { transition-delay: 60ms; }
.reveal:nth-child(3) { transition-delay: 120ms; }
.reveal:nth-child(4) { transition-delay: 180ms; }
```

```javascript
// Intersection observer setup
const observer = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      observer.unobserve(e.target);
    }
  }),
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
```

### Reading Progress Bar

```javascript
// Scroll-linked reading progress (story pages only)
window.addEventListener('scroll', () => {
  const doc = document.documentElement;
  const scrolled = doc.scrollTop;
  const max = doc.scrollHeight - doc.clientHeight;
  const pct = Math.min(100, (scrolled / max) * 100);
  document.querySelector('.reading-progress').style.width = pct + '%';
}, { passive: true });
```

### Page Transitions

```css
/* Soft cross-fade between pages (works with Next.js page router) */
.page-enter { opacity: 0; }
.page-enter-active {
  opacity: 1;
  transition: opacity 250ms var(--ease-out-soft);
}
.page-exit { opacity: 1; }
.page-exit-active {
  opacity: 0;
  transition: opacity 200ms;
}
```

### Reduced Motion Override

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .reveal { opacity: 1; transform: none; }
}
```

---

## 8. Imagery & Visual Assets

### Photo Treatment Philosophy
- **No sepia filters** — use actual color photos as-is
- **Portraits:** Desaturate slightly (85% saturation) for consistency, no color grading
- **Landscape photos:** Full saturation — the Mississippi green and red clay are selling points
- **Oil painting:** Use at full color — Barbara Castell's portrait is a key brand asset

### Hero Background
- Use the back cover red clay road photo as the primary hero background
- Overlay: `linear-gradient(to top, rgba(44,28,16,0.85), rgba(44,28,16,0.1))`
- Never let road photo appear without the overlay — text legibility is critical

### Era Illustrations (optional future state)
Each life chapter could have a hand-illustrated scene in watercolor style:
- Red Clay Hills era: Red dirt road, clapboard church, tall pines
- Building era: Cityscapes, briefcase, handshake
- Legacy era: Family portrait, open book, sunset

---

## 9. Responsive Design Breakpoints

```css
/* Mobile first */
--bp-sm:   480px;   /* Large mobile */
--bp-md:   768px;   /* Tablet */
--bp-lg:   1024px;  /* Desktop */
--bp-xl:   1280px;  /* Wide desktop */

/* Usage */
@media (min-width: 768px)  { /* tablet+ */ }
@media (min-width: 1024px) { /* desktop+ */ }
```

### Key Mobile Adaptations
- Story card grid: `1 col → 2 col → 3 col`
- Navigation: Hamburger menu below 768px, full horizontal above
- Age toggle: Moves inside hamburger menu on mobile
- Story reading: Full-width, reduced padding, `font-size: 1rem`
- Timeline: Vertical only (no horizontal scroll version on mobile)
- Hero: Min-height `75vh` on mobile, `85vh` on desktop
- "Ask Keith" input: Fixed to bottom of viewport on mobile

---

## 10. Accessibility

```css
/* Focus ring — visible, warm, non-default */
*:focus-visible {
  outline: 2px solid var(--color-clay);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}

/* Skip-to-content link */
.skip-link {
  position: absolute;
  top: -100%;
  left: var(--space-4);
  padding: var(--space-2) var(--space-4);
  background: var(--color-clay);
  color: white;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  z-index: 999;
  font-family: var(--font-ui);
  font-size: 0.875rem;
}
.skip-link:focus { top: 0; }
```

### ARIA & Semantic HTML Requirements
- `<nav>` with `aria-label="Main navigation"` for the nav bar
- `<main id="main-content">` for skip link target
- Story cards: use `<article>` not `<div>`
- Timeline nodes: `role="listitem"` with `aria-label="Era: Red Clay Hills, 1935 to 1955"`
- "Ask Keith" chat: `aria-live="polite"` on the messages container
- Reading progress bar: `role="progressbar"`, `aria-valuenow`, `aria-label="Reading progress"`
- Images: Alt text format: `"Keith Cobb, circa [year] — [brief description]"`

### Color Contrast Minimums
| Text | Background | Ratio | Pass? |
|------|-----------|-------|-------|
| `#2C1C10` ink on `#F7F3ED` | — | 13.8:1 | AAA |
| `#8B2C2C` burgundy on `#F7F3ED` | — | 7.2:1 | AAA |
| `#FDF8F4` on `#B5451B` clay button | — | 4.8:1 | AA |
| `#7A2E0E` on `#FDF0E8` tag | — | 5.9:1 | AA |

---

## 11. Implementation Notes (Next.js + Tailwind)

### Tailwind Theme Extension

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        burgundy: { DEFAULT: '#8B2C2C', dark: '#6B1E1E', light: '#F5E8E8' },
        clay:     { DEFAULT: '#B5451B', mid: '#C8662A', light: '#FDF0E8', border: '#E8B090' },
        ink:      { DEFAULT: '#2C1C10', muted: '#6B5040', ghost: '#A89070' },
        ocean:    { DEFAULT: '#4A7FA0', light: '#7AB3C9', pale: '#E8F4F8' },
        moss:     { DEFAULT: '#3D6B35', mid: '#6BA35A', pale: '#EEF4EC' },
        gold:     { DEFAULT: '#D4A843', pale: '#F5E8C8' },
        parchment: '#F0E8D5',
        'warm-white': '#F7F3ED',
        'warm-white-2': '#FBF8F4',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['Lora', '"Times New Roman"', 'serif'],
        ui:      ['Inter', '"Helvetica Neue"', 'sans-serif'],
      },
      maxWidth: {
        story: '680px',
        content: '800px',
        wide: '1100px',
      },
      borderRadius: {
        full: '9999px',
      },
    },
  },
}
```

### CSS Variables in `globals.css`

Paste the full `:root {}` block from Section 2 into `app/globals.css`. All component styles reference these variables so a future dark-mode or "print mode" is a single override block.

### Component File Structure (suggested)

```
components/
  layout/
    Nav.tsx
    Hero.tsx
    Footer.tsx
  story/
    StoryCard.tsx          ← standard card
    StoryCardFeatured.tsx  ← large with image
    StoryReader.tsx        ← full reading page layout
    PullQuote.tsx
    ReadingProgress.tsx
    DropCap.tsx
  timeline/
    Timeline.tsx
    TimelineEra.tsx
    TimelineStoryNode.tsx
  ask/
    AskKeith.tsx
    ChatBubble.tsx
    SuggestionChips.tsx
  ui/
    Tag.tsx
    Badge.tsx
    Button.tsx
    SearchBar.tsx
    AgeToggle.tsx
```

### Key Next.js Patterns

```typescript
// Age mode — stored in localStorage + Context
const AgeContext = React.createContext<'young' | 'teen' | 'adult'>('adult');

// Reading progress — mounted only on story pages
useEffect(() => {
  if (typeof window === 'undefined') return;
  const handler = () => {
    const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
    setProgress(Math.min(100, pct));
  };
  window.addEventListener('scroll', handler, { passive: true });
  return () => window.removeEventListener('scroll', handler);
}, []);

// Scroll reveal — use IntersectionObserver hook
const useReveal = (ref: React.RefObject<Element>) => {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.12 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
};
```

---

## 12. Quick-Reference Cheatsheet

### Colors at a glance
| Token | Hex | Use for |
|-------|-----|---------|
| `--color-burgundy` | `#8B2C2C` | Headlines, active nav, brand identity |
| `--color-clay` | `#B5451B` | Buttons, CTAs, progress bar |
| `--color-parchment` | `#F0E8D5` | Page background |
| `--color-warm-white` | `#F7F3ED` | Cards, panels |
| `--color-ink` | `#2C1C10` | Body text |
| `--color-ink-muted` | `#6B5040` | Captions, secondary |
| `--color-ink-ghost` | `#A89070` | Placeholders, meta |
| `--color-ocean` | `#4A7FA0` | Links, info |
| `--color-green` | `#3D6B35` | Success, "read" |
| `--color-gold` | `#D4A843` | Featured, highlights |

### Fonts at a glance
| Role | Font |
|------|------|
| Titles, headlines, pull quotes | Playfair Display |
| Story body text | Lora |
| Nav, UI, tags, metadata | Inter |

### What to avoid
- Sepia or brown-filtered images
- Cold stark white (`#FFFFFF`) as page background — always use `#F7F3ED`
- Generic sans-serif body text — Lora is the story voice
- Purple/teal gradients — this is not a SaaS app
- Dark navy sidebars — the nav should feel warm, not corporate
- Age mode as just a font-size toggle — it should feel like a genuinely different experience

---

*This spec was built from the dust jacket of "Out of the Red Clay Hills" by Keith Cobb (2015), competitive analysis of Remento, LifeTales, Storyworth, Longreads, The New Yorker, and NYT Interactive, and the 6 UI/UX design concepts defined for this project.*