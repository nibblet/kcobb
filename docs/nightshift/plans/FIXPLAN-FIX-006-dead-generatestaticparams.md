# Fix: [FIX-006] Dead `generateStaticParams` in Story/Theme Detail Pages

## Problem
`generateStaticParams` is defined in both `src/app/stories/[storyId]/page.tsx` and `src/app/themes/[slug]/page.tsx`, but both pages render as Dynamic (ƒ) at build time because the root layout (`src/app/layout.tsx`) calls `createClient()` inside `getInitialAgeMode()`, which reads cookies via Supabase SSR.

In Next.js 16 App Router, any layout that reads cookies forces all descendent pages into dynamic rendering — `generateStaticParams` is silently ignored. The functions still execute at build time (adding time to the build) but produce no static HTML.

Impact: Minor — a few extra seconds at build time, slight code confusion. The app functions correctly.

## Root Cause
- `src/app/layout.tsx:16-37` — `getInitialAgeMode()` calls `createClient()` (Supabase SSR) which calls `cookies()` from `next/headers`, making the layout and all children dynamic.
- `src/app/stories/[storyId]/page.tsx:5-8` — `generateStaticParams()` defined but has no effect.
- `src/app/themes/[slug]/page.tsx:5-8` — same.

Since this app is entirely auth-gated (middleware redirects unauthenticated users on every route), static generation would not be appropriate anyway — static pages can't enforce auth at the CDN level.

## Steps

1. Open `src/app/stories/[storyId]/page.tsx`
2. Remove the `generateStaticParams` export entirely (lines 5-8):
   ```ts
   // Remove this:
   export async function generateStaticParams() {
     const stories = getAllStories();
     return stories.map((s) => ({ storyId: s.storyId }));
   }
   ```
3. Also remove the `getAllStories` import if it's no longer used anywhere in the file:
   ```ts
   // Before:
   import { getAllStories, getStoryById } from "@/lib/wiki/parser";
   // After:
   import { getStoryById } from "@/lib/wiki/parser";
   ```
4. Open `src/app/themes/[slug]/page.tsx`
5. Remove the `generateStaticParams` export (lines 5-8):
   ```ts
   // Remove this:
   export async function generateStaticParams() {
     const themes = getAllThemes();
     return themes.map((t) => ({ slug: t.slug }));
   }
   ```
6. Check if `getAllThemes` is still used in the file (it IS used on line 1 import and called inside `getThemeBySlug` or similar). Looking at the page: `getAllThemes` was only imported for `generateStaticParams` — but actually `getThemeBySlug` is the function used in the page body. Adjust import accordingly:
   ```ts
   // Before:
   import { getAllThemes, getThemeBySlug, getStoryById } from "@/lib/wiki/parser";
   // After:
   import { getThemeBySlug, getStoryById } from "@/lib/wiki/parser";
   ```
7. Run `npm run build` to verify all routes still work (should see same ƒ symbols but build is slightly faster)
8. Run `npm run lint` to confirm no new errors

**Done 2026-04-13:** Removed `generateStaticParams` and unused list imports from both pages.

## Files Modified
- `src/app/stories/[storyId]/page.tsx` — Remove `generateStaticParams` export and `getAllStories` import
- `src/app/themes/[slug]/page.tsx` — Remove `generateStaticParams` export and `getAllThemes` import

## New Files (if any)
None.

## Database Changes (if any)
None.

## Verify
- [x] Build passes without errors
- [x] `/stories/[storyId]` still shows as ƒ (Dynamic) — expected, correct for auth-gated app
- [x] `/themes/[slug]` still shows as ƒ (Dynamic)
- [ ] Story detail pages load and display correctly *(manual)*
- [ ] Theme detail pages load and display correctly *(manual)*
- [x] Lint passes (or same error count as before — no regressions)
