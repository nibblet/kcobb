# Fix: [FIX-009] No Rate Limiting on /api/tell/draft

## Problem
`/api/tell/draft` calls Claude Sonnet with `max_tokens: 4096` to compose a full story draft.
This endpoint has no rate limiting. An authenticated user (or a script) can hammer it repeatedly,
each call consuming ~4K output tokens (most expensive Claude usage in the app).

**Impact:** Financial risk. Unlike `/api/ask` and `/api/tell` which are both rate-limited at
20 req/min, the draft endpoint is completely unguarded.

Also: on JSON parse failure, the endpoint returns `{ error: "...", raw: rawText }` which leaks
the raw Claude response (potentially including the user's story conversation) in an API error.
This is a minor privacy concern — the `raw` field should be removed from the error response.

## Root Cause
`src/app/api/tell/draft/route.ts` — no `checkRateLimit()` call before the Anthropic API call.
The rate limiter (`src/lib/rate-limit.ts`) is already imported in `/api/tell` and `/api/ask`
but was not added to this route.

The `raw` leak is at line 95:
```ts
return Response.json({ error: "Failed to parse story draft", raw: rawText }, { status: 500 });
```

## Steps

### 1. Add rate limiting to `src/app/api/tell/draft/route.ts`

At the top of the file, add the import:
```ts
import { checkRateLimit } from "@/lib/rate-limit";
```

After the `user` auth check (around line 10), add:
```ts
// Draft endpoint is expensive (4096 tokens) — tighter limit than chat: 5 per minute
const rateLimit = checkRateLimit(`${user.id}:draft`, 5, 60_000);
if (!rateLimit.allowed) {
  return Response.json(
    { error: "Please wait before generating another draft." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) },
    }
  );
}
```

Using a separate key (`${user.id}:draft`) keeps the draft limit independent of the chat limit.

### 2. Remove the `raw` field from the error response

Find (around line 95):
```ts
return Response.json(
  { error: "Failed to parse story draft", raw: rawText },
  { status: 500 }
);
```

Replace with:
```ts
console.error("[tell/draft] Failed to parse Claude response:", rawText.slice(0, 200));
return Response.json(
  { error: "Failed to compose story draft — please try again." },
  { status: 500 }
);
```

### 3. Run `npm run build` to verify no breakage
### 4. Run `npm run lint`

## Files Modified
- `src/app/api/tell/draft/route.ts` — adds rate limit (5/min), removes `raw` from error response

## Verify
- [ ] Build passes
- [ ] Call `/api/tell/draft` 6 times rapidly — 6th call returns 429
- [ ] On parse error (hard to test manually), error response should not contain `raw`
