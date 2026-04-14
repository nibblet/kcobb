# Fix: [FIX-008] submitDraft Ignores User Edits to Title/Body

## Problem
On the Tell page, users can edit the AI-composed story title and body in the review step, but
those edits are silently discarded when they click "Submit Story." Only the original AI-generated
draft (saved by `/api/tell/draft`) is preserved in Supabase. The user never knows their edits
were lost — the submission appears to succeed.

**Impact:** Anyone who corrects AI errors or personalizes their story draft loses those changes
on submit.

## Root Cause
`src/app/tell/page.tsx`, `submitDraft()` function (lines 162–167):

```ts
async function submitDraft() {
  if (!draft) return;
  setSubmitted(true);
  // For now, the draft is already saved in Supabase by the /api/tell/draft endpoint.
  // Future: update the draft with edited title/body if changed.
}
```

The comment acknowledges the gap but leaves it unimplemented. `editTitle` and `editBody` state
hold the (possibly edited) values — they just never get sent back to Supabase.

## Steps

### 1. Add a PATCH endpoint to update a draft

Create `src/app/api/tell/draft/update/route.ts`:

```ts
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { draftId, title, body } = await request.json() as {
    draftId: string;
    title: string;
    body: string;
  };

  if (!draftId || !title?.trim() || !body?.trim()) {
    return Response.json({ error: "draftId, title, and body required" }, { status: 400 });
  }

  // Verify ownership
  const { data: draft } = await supabase
    .from("sb_story_drafts")
    .select("id, contributor_id")
    .eq("id", draftId)
    .single();

  if (!draft || draft.contributor_id !== user.id) {
    return Response.json({ error: "Draft not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("sb_story_drafts")
    .update({ title: title.trim(), body: body.trim(), updated_at: new Date().toISOString() })
    .eq("id", draftId);

  if (error) {
    return Response.json({ error: "Failed to update draft" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
```

### 2. Update `submitDraft()` in `src/app/tell/page.tsx`

Replace lines 162–167:

```ts
// BEFORE
async function submitDraft() {
  if (!draft) return;
  setSubmitted(true);
  // For now, the draft is already saved in Supabase by the /api/tell/draft endpoint.
  // Future: update the draft with edited title/body if changed.
}
```

```ts
// AFTER
async function submitDraft() {
  if (!draft) return;
  const hasEdits = editTitle !== draft.title || editBody !== draft.body;
  if (hasEdits) {
    const res = await fetch("/api/tell/draft/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId: draft.draftId, title: editTitle, body: editBody }),
    });
    if (!res.ok) {
      setError("Failed to save your edits. Please try again.");
      return;
    }
  }
  setSubmitted(true);
}
```

### 3. Run `npm run build` to verify no breakage
### 4. Run `npm run lint`

## Files Modified
- `src/app/tell/page.tsx` — `submitDraft()` now PATCHes edits before setting submitted

## New Files
- `src/app/api/tell/draft/update/route.ts` — PATCH endpoint to update title/body

## Database Changes
None — uses existing `sb_story_drafts` table. RLS policy "Users can update own drafts" already covers this.

## Verify
- [ ] Build passes
- [ ] On Tell page: complete a chat, get a draft, edit the title, click Submit — confirm the new title appears in admin `/admin/drafts`
- [ ] On Tell page: submit without edits — confirm no extra API call (hasEdits is false)
- [ ] Attempt PATCH with someone else's draftId — expect 404
