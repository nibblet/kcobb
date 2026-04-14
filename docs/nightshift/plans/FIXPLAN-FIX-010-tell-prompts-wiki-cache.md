# Fix: [FIX-010] getWikiSummaries() in parser.ts Has No Cache

## Problem
`src/lib/wiki/parser.ts` exports `getWikiSummaries()` (line 231), which reads `content/wiki/index.md`
from disk on **every call** with no caching:

```ts
export function getWikiSummaries(): string {
  return readWikiFile("index.md");  // disk read every time
}
```

`src/lib/ai/tell-prompts.ts` imports and calls this function on every `/api/tell` request:
```ts
import { getWikiSummaries } from "@/lib/wiki/parser";
// ...
const wikiIndex = getWikiSummaries();  // called inside buildTellSystemPrompt()
```

**Impact:** Every story-gathering chat message (`/api/tell`) reads `index.md` from disk. The
file is ~several KB and immutable at runtime, so re-reading it is pure waste. This affects
performance on every chat turn.

**Contrast:** `src/lib/ai/prompts.ts` has its own `cachedWikiSummaries` module variable and
caches the same file content. The `tell-prompts.ts` module bypasses this cache by calling
the uncached `parser.ts` function directly.

## Root Cause
Two separate code paths read the same file:
1. `prompts.ts` (for Ask Keith): reads + caches in its own module variable
2. `tell-prompts.ts` (for Tell): calls `parser.ts`'s exported `getWikiSummaries()` which has no cache

## Steps

### Option A (preferred): Add module-level cache to `tell-prompts.ts`

In `src/lib/ai/tell-prompts.ts`, add a module-level cache variable and wrap the call:

```ts
// BEFORE (at top of file):
import { getWikiSummaries } from "@/lib/wiki/parser";

// AFTER:
import { getWikiSummaries as _getWikiSummaries } from "@/lib/wiki/parser";

let cachedWikiSummaries: string | null = null;

function getWikiSummaries(): string {
  if (!cachedWikiSummaries) {
    cachedWikiSummaries = _getWikiSummaries();
  }
  return cachedWikiSummaries;
}
```

The `buildTellSystemPrompt` function then calls the local cached wrapper, not the direct parser export.

### Option B (alternative): Add cache to parser.ts exported function

In `src/lib/wiki/parser.ts`, update the exported function:

```ts
// BEFORE:
export function getWikiSummaries(): string {
  return readWikiFile("index.md");
}

// AFTER:
let _cachedWikiSummaries: string | null = null;

export function getWikiSummaries(): string {
  if (!_cachedWikiSummaries) {
    _cachedWikiSummaries = readWikiFile("index.md");
  }
  return _cachedWikiSummaries;
}
```

**Recommendation: Option A.** It keeps the change isolated to `tell-prompts.ts` and doesn't
risk affecting any other callers of `parser.ts` whose tests or behavior might depend on fresh
reads.

### 3. Run `npm run build` to verify no breakage
### 4. Run `npm run lint`

## Files Modified
- `src/lib/ai/tell-prompts.ts` — adds module-level cache wrapper around `getWikiSummaries`

## Verify
- [ ] Build passes
- [ ] Lint passes
- [ ] `/api/tell` responds normally (no regression)
