# Fix: [FIX-011] Dead `generateStaticParams` in Journey Routes

## Problem
`generateStaticParams` is exported from two journey route files but is effectively dead code.
Because the auth layout (`src/app/layout.tsx`) reads cookies (Supabase session), all routes
in the app render dynamically at request time — `generateStaticParams` is ignored by Next.js 16.
The build confirms this: all journey routes show `ƒ (Dynamic)`.

This is the same issue as FIX-006 (resolved for stories and themes) but reintroduced when
the journeys feature was built.

**Impact:** Low severity. App works correctly. But the dead exports add confusion and a few
extra seconds to each build as Next.js tries (and then ignores) the params.

## Root Cause
- `src/app/journeys/[slug]/page.tsx` lines 7–9: `export function generateStaticParams()`
- `src/app/journeys/[slug]/[step]/page.tsx` lines 12–19: `export function generateStaticParams()`
- Also: both files import `getJourneySlugs` / `getAllJourneys` only for `generateStaticParams`

## Steps

### 1. Open `src/app/journeys/[slug]/page.tsx`

Remove lines 7–9:
```ts
export function generateStaticParams() {
  return getJourneySlugs().map((slug) => ({ slug }));
}
```

Remove the `getJourneySlugs` from the import on line 3 (keep `getJourneyBySlug`):
```ts
// BEFORE:
import { getJourneyBySlug, getJourneySlugs } from "@/lib/wiki/journeys";
// AFTER:
import { getJourneyBySlug } from "@/lib/wiki/journeys";
```

### 2. Open `src/app/journeys/[slug]/[step]/page.tsx`

Remove lines 12–19:
```ts
export function generateStaticParams() {
  const journeys = getAllJourneys();
  return journeys.flatMap((j) =>
    j.storyIds.map((_, i) => ({
      slug: j.slug,
      step: String(i + 1),
    }))
  );
}
```

Remove `getAllJourneys` from the import on line 4 (keep `getJourneyBySlug`):
```ts
// BEFORE:
import { getAllJourneys, getJourneyBySlug } from "@/lib/wiki/journeys";
// AFTER:
import { getJourneyBySlug } from "@/lib/wiki/journeys";
```

### 3. Run `npm run build` to verify routes still render as ƒ (Dynamic)
### 4. Run `npm run lint`

## Files Modified
- `src/app/journeys/[slug]/page.tsx` — remove dead `generateStaticParams`, unused `getJourneySlugs` import
- `src/app/journeys/[slug]/[step]/page.tsx` — remove dead `generateStaticParams`, unused `getAllJourneys` import

## Verify
- [ ] Build passes — journey routes still listed as ƒ (Dynamic)
- [ ] Lint passes — no new unused import warnings
- [ ] Navigating to `/journeys/leadership-under-pressure` works correctly
- [ ] Navigating to `/journeys/leadership-under-pressure/1` works correctly
