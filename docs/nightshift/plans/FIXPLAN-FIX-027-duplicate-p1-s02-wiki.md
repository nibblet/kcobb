# Fix: [FIX-027] Duplicate P1_S02 Wiki File

## Problem
Two wiki files exist for story P1_S02:
- `content/wiki/stories/P1_S02-a-v-ery-busy-teenager.md` (105 lines — typo in slug, shorter/older version)
- `content/wiki/stories/P1_S02-a-very-busy-teenager.md` (133 lines — correct, fuller version)

`generate-static-data.ts` reads all `*.md` files in the directory and parses them. Both files declare `**Story ID:** P1_S02`, so two entries appear in `storiesData`. This causes:

1. **Story library shows two cards for P1_S02** — confusing duplicate in the UI
2. **`storiesData.length = 50` instead of 49** — header says "50 stories" (wrong)
3. **`StoriesReadProgress` progress bar stuck at 49/50 = 98%** — a family member who reads all real stories never reaches 100%
4. **Corpus queries return duplicate story** — Ask Keith and related-story lists may reference it twice

## Root Cause
A typo-named file `P1_S02-a-v-ery-busy-teenager.md` (note the `v-ery` split) was never deleted after the correct `P1_S02-a-very-busy-teenager.md` was generated. Likely created during an earlier compile-wiki run when the story title had a parsing artifact.

## Steps

1. Delete the misspelled file:
   ```bash
   rm content/wiki/stories/P1_S02-a-v-ery-busy-teenager.md
   ```

2. Regenerate static data:
   ```bash
   npx tsx scripts/generate-static-data.ts
   ```

3. Verify the story count:
   ```bash
   npx tsx -e "import { storiesData } from './src/lib/wiki/static-data'; console.log(storiesData.filter(s=>s.source==='memoir').length, storiesData.length);"
   ```
   Expected: `39 49`

4. Run build:
   ```bash
   npm run build
   ```

5. Commit both changes:
   ```bash
   git add content/wiki/stories/P1_S02-a-v-ery-busy-teenager.md src/lib/wiki/static-data.ts
   git commit -m "fix: remove duplicate P1_S02 wiki file, regenerate static-data"
   ```

## Files Modified
- `content/wiki/stories/P1_S02-a-v-ery-busy-teenager.md` — deleted
- `src/lib/wiki/static-data.ts` — regenerated (one fewer P1_S02 entry, `storiesData.length` goes from 50 to 49)

## Verify
- [x] `storiesData.length === 49` after regeneration
- [x] Story library has one canonical P1_S02 entry in static data
- [x] Progress denominator corrected to 49 stories
- [x] Build passes

## Resolution
Resolved on 2026-04-20.

- Deleted `content/wiki/stories/P1_S02-a-v-ery-busy-teenager.md`.
- Regenerated `src/lib/wiki/static-data.ts`.
- Verified story counts with `npx tsx -e` command output: `39 49`.
- Verified production build with `npm run build` (pass).
