# Fix: [FIX-026] StoriesReadProgress Displays readCount > totalStories

## Problem
`StoriesReadProgress.tsx` displays `{readCount} of {totalStories}` in the progress tile. The `readCount` comes from `sb_story_reads` which counts ALL story reads — including family-contributed stories (P2+). The `totalStories` comes from `storiesData.length` which only counts static (wiki-compiled) stories: memoir + interview.

If a user reads a family-contributed story, `readCount` can exceed `totalStories`, showing a confusing `"51 of 49"` text in the profile tile.

## Root Cause
- `profile-gallery-data.ts` line 222: `readCount: reads.length` — unfiltered by story type
- `profile/page.tsx` line 78: `totalStories={storiesData.length}` — 49 static stories only
- The progress bar itself is correctly capped with `Math.min(100, ...)` but the display text is not

## Steps

1. Open `src/components/profile/StoriesReadProgress.tsx`

2. Add a display-capped count constant after the `complete` declaration:
   ```tsx
   const displayCount = Math.min(readCount, totalStories);
   ```

3. Replace the `{readCount}` in the text with `{displayCount}`:
   ```tsx
   // Before:
   {readCount} of {totalStories}
   // After:
   {displayCount} of {totalStories}
   ```

4. Run `npm run build` to verify no breakage.

## Files Modified
- `src/components/profile/StoriesReadProgress.tsx` — 2-line change (add `displayCount`, use in JSX)

## Verify
- [ ] Build passes
- [ ] Profile page progress tile never shows "N of M" where N > M
- [ ] User who has read 49+ stories (including family ones) sees "49 of 49" or similar capped text
