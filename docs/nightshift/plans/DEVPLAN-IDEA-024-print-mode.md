# Dev Plan: [IDEA-024] Story Print Mode — Clean Print-Friendly Story View

## What This Does
Adds a "Print story" button to every story detail page. When clicked, it calls `window.print()` with Tailwind `print:` CSS utilities applied across the page to hide navigation, audio controls, TOC sidebar, action buttons, and other UI chrome — leaving only the story title, body, author, principles list, and key quotes in a clean, readable layout. No new routes, no DB changes. Designed for grandparents and family members who want a physical copy of a story to hold or mail.

## User Stories
- As a grandparent, I want to print "A Very Busy Teenager" so I can give it to my granddaughter to read.
- As a family member, I want a paper copy of a story to bring to a family reunion.
- As an adult reader, I want to print a story I've highlighted so I can annotate it in the margins.

## Implementation

### Phase 1: CSS — Hide Chrome on Print

Open `src/app/globals.css`.

Add a `@media print` block at the end of the file:

```css
@media print {
  /* Hide all UI chrome */
  nav,
  header,
  footer,
  [data-print-hide] {
    display: none !important;
  }

  /* Reset body colors to black on white for print */
  body {
    background: white !important;
    color: black !important;
  }

  /* Avoid breaking inside story paragraphs */
  .prose p,
  .prose li {
    page-break-inside: avoid;
    orphans: 3;
    widows: 3;
  }

  /* Show the print-only attribution footer */
  [data-print-show] {
    display: block !important;
  }

  /* Inline links show their URL in print */
  a[href]:after {
    content: none; /* don't show URLs in family storybook */
  }
}
```

**Checkpoint:** In browser dev tools, switch to print media — chrome disappears, story text remains.

### Phase 2: Markup — Add `data-print-hide` to Page Elements

Open `src/app/stories/[storyId]/page.tsx`.

1. Add `data-print-hide` to the sidebar TOC wrapper (`<StoryTOC ...>`):
   ```tsx
   <div data-print-hide>
     <StoryTOC sections={tocSections} />
   </div>
   ```

2. Wrap the footer CTA block (lines ~236-255, the "Chat about this story" + "Browse more stories" buttons) in `data-print-hide`:
   ```tsx
   <div data-print-hide>
     {/* existing CTA div contents */}
   </div>
   ```

3. Wrap the audio controls, favorite button, and correction buttons similarly (they already appear in `StoryAudioControls`, `FavoriteButton`, `AskAboutStory`, `StoryCorrection` — add `data-print-hide` to the container div that wraps these in the page).

4. Add a print-only attribution footer AFTER the story body, hidden in screen mode but shown in print:
   ```tsx
   <div className="hidden" data-print-show>
     <hr className="my-6" />
     <p className="text-sm text-gray-500">
       From the Keith Cobb Family Storybook — stories.cobbcorner.com
     </p>
   </div>
   ```

**Checkpoint:** Trigger `window.print()` in browser console — story body is clean; nav, audio, CTAs are hidden; attribution appears.

### Phase 3: Print Button

Still in `src/app/stories/[storyId]/page.tsx`, add a "Print story" button to the story header area (below the title/meta, near the existing action buttons).

Since the page is a server component and the button needs `onClick`, create a small `PrintButton.tsx` client component:

**New file: `src/components/story/PrintButton.tsx`**
```tsx
"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="type-ui inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
      data-print-hide
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3.5 w-3.5"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9v-1h8v1a1 1 0 01-1 1H7a1 1 0 01-1-1zm7-4a1 1 0 11-2 0 1 1 0 012 0z"
          clipRule="evenodd"
        />
      </svg>
      Print
    </button>
  );
}
```

Import and add to `page.tsx` in the header meta row (same area as ReadBadgeAgeAware):
```tsx
import { PrintButton } from "@/components/story/PrintButton";
// ...
<PrintButton />
```

The button itself has `data-print-hide` so it doesn't appear in the print output.

**Checkpoint:** Print button visible on story page; clicking opens browser print dialog; printed output shows only title, body, principles, quotes, attribution.

## Content Considerations
- Story body, title, author, and principles print cleanly from existing markdown rendering
- Book images (inline photos) will print if browser print settings include background images — no extra work needed
- `@tailwindcss/typography` prose styles are mostly print-safe

## Age-Mode Impact
- All age modes work the same for print — the story body itself is age-neutral
- No age-specific print variants needed

## Testing
- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Print button visible on `/stories/P1_S01`
- [ ] Browser print preview: nav, audio controls, favorite button, CTAs hidden
- [ ] Story title, body, principles, attribution appear in print preview
- [ ] Escape from print dialog returns to normal view with no visual glitch
- [ ] `data-print-hide` on print button itself — button not visible in print

## Dependencies
None. FIX-028 is unrelated.

## Estimated Total: 30–45 min
