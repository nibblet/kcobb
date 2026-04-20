# Dev Plan: [IDEA-023] Explore Hub — Interactive Story Map

## What This Does
A dedicated `/explore` page that gives family members a visual "map" of the storybook. Four tabs bring together all the visualization infrastructure that's currently scattered across `/themes` and `/principles`:

- **Themes** — `ChordDiagram` (theme co-occurrence) + `ThemePrincipleMatrix` (which themes map to which principles)
- **Stories** — `StorySankey` (how stories flow across eras into themes)
- **Principles** — `PrincipleFormationTimeline` (when each of the 12 principles crystallized across Keith's life)
- **People** — People grid (from `/people`, reused here) with story-count context

All visualization components and data pipelines already exist. This is a pure UI assembly task — no new data structures, no new API routes, no DB changes.

## User Stories
- As an adult family member, I want to see how Keith's themes and principles connect so I can understand the patterns in his leadership.
- As a teenager, I want to explore which stories are connected to each other visually rather than just reading a list.
- As a grandchild, I want to see "who are the important people" and navigate to their stories from one place.

## Implementation

### Phase 1: Route and Tab Shell

1. Create `src/app/explore/page.tsx` (server component):
   ```tsx
   import { ExplorePageClient } from "./ExplorePageClient";
   import {
     buildThemePrincipleMatrix,
     buildStorySankey,
     buildEraPrincipleMatrix,
     buildEraThemeMatrix,
     buildPeopleGraph,
   } from "@/lib/wiki/graph";
   import { getAllCanonicalPrinciples } from "@/lib/wiki/parser";
   import { getThemes } from "@/lib/wiki/parser";
   import { getPeopleCards } from "@/lib/wiki/static-data";

   export const metadata = { title: "Explore", description: "Interactive map of Keith's stories and connections." };

   export default async function ExplorePage() {
     const [
       themePrincipleMatrix,
       storySankey,
       eraPrincipleMatrix,
       eraThemeMatrix,
       principles,
       themes,
       people,
     ] = await Promise.all([
       buildThemePrincipleMatrix(),
       buildStorySankey(),
       buildEraPrincipleMatrix(),
       buildEraThemeMatrix(),
       getAllCanonicalPrinciples(),
       getThemes(),
       getPeopleCards(),
     ]);

     return (
       <ExplorePageClient
         themePrincipleMatrix={themePrincipleMatrix}
         storySankey={storySankey}
         eraPrincipleMatrix={eraPrincipleMatrix}
         eraThemeMatrix={eraThemeMatrix}
         principles={principles}
         themes={themes}
         people={people}
       />
     );
   }
   ```

   **Note:** Check actual function signatures in `src/lib/wiki/graph.ts` and `src/lib/wiki/parser.ts` before writing `page.tsx`. The function names above are based on STATUS.md and graph.ts. Adjust imports and call signatures to match what actually exists.

   **Checkpoint:** `/explore` renders without error (empty page is fine at this stage).

### Phase 2: Client Wrapper with Tab State

2. Create `src/app/explore/ExplorePageClient.tsx` (`"use client"`):
   - Four tab buttons: "Themes", "Stories", "Principles", "People"
   - Active tab state with `useState`
   - Conditional render of the active tab's content
   - Tab bar styled similar to the filter buttons on `/stories` page

   ```tsx
   const TABS = ["Themes", "Stories", "Principles", "People"] as const;
   type Tab = typeof TABS[number];
   const [activeTab, setActiveTab] = useState<Tab>("Themes");
   ```

   **Checkpoint:** Tab switching works; each tab shows a placeholder text.

### Phase 3: Wire Up Existing Visualization Components

3. **Themes tab**: Render `ChordDiagram` and `ThemePrincipleMatrix` side by side (or stacked on mobile).
   - `ChordDiagram` already exists on `/themes/page.tsx` — import and reuse
   - `ThemePrincipleMatrix` already exists on `/themes/page.tsx` — import and reuse
   - Pass same props as the themes page currently does

4. **Stories tab**: Render `StorySankey` full-width.
   - `StorySankey` already exists on `/themes/page.tsx` — import and reuse
   - Full-width layout fits the Sankey well

5. **Principles tab**: Render `PrincipleFormationTimeline` full-width.
   - `PrincipleFormationTimeline` already exists on `/principles/page.tsx` — import and reuse
   - Pass same props (canonical principles + era data)

6. **People tab**: Render a simple grid of people cards (subset of `/people` grid).
   - Reuse the person card pattern from `src/app/people/page.tsx`
   - No editing controls (Keith-only features are on the dedicated `/people/[slug]` pages)
   - Link each card to `/people/[slug]`
   - Sort by story count descending (most-featured people first)

   **Checkpoint:** All four tabs render their content. Visual parity with existing pages.

### Phase 4: Polish and Nav Link

7. Add "Explore" to the main navigation (`src/components/layout/Nav.tsx` or wherever the nav is defined). Check the nav source file first.

8. Add the `/explore` route to the home page nav cards if it fits the grid pattern.

9. Verify mobile layout for each tab (Sankey and ChordDiagram may need overflow-x: scroll wrappers — check how they handle this on the themes page currently).

   **Checkpoint:** Explore appears in nav. All four tabs work on mobile.

## Content Considerations
- No wiki content changes needed
- Visualizations are all computed from existing parsed data
- People tab pulls from `storiesData` / `getPeopleCards()` — no new DB queries at render time

## Age-Mode Impact
- All three modes see the same visualizations
- Adult mode benefits most from the complexity; young readers will likely gravitate to People tab (faces/names)
- No age-aware text changes needed

## Testing
- [ ] Build passes
- [ ] `/explore` route renders without error
- [ ] All 4 tabs render correct content
- [ ] No regressions on `/themes` or `/principles` (shared components)
- [ ] Mobile layout tested for each tab (especially Sankey and ChordDiagram)
- [ ] "Explore" link works from nav

## Dependencies
- No prerequisites

## Estimated Total: 1.5–2 hours
