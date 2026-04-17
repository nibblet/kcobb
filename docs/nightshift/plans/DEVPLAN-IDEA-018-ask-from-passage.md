# Dev Plan: [IDEA-018] Ask Keith About a Saved Passage

## What This Does
Family members can now save passages from Keith's stories to `/profile/highlights`. Each
saved passage is a meaningful quote — a moment or principle that resonated. But after saving,
there's nowhere to go with it. The passage sits in a list.

This feature adds an "Ask Keith about this" button to each saved passage in
`/profile/highlights`. Clicking it opens the Ask Keith chat (`/ask`) with the saved passage
pre-loaded as the initial context — the AI knows exactly which quote the family member is
thinking about and can respond specifically to it.

For grandchildren especially, this transforms saved passages from a personal archive into
conversation starters with their grandfather.

## User Stories
- As a grandchild, I want to ask Keith about a passage I saved so I can learn more about what
  he meant or felt in that moment.
- As a family member, I want my saved highlight to be the starting point of a conversation, not
  just a note I can re-read.

## Implementation

### Phase 1: Ask Page — Accept `passage` Query Param

**File:** `src/app/ask/page.tsx`

1. The `ask` page is a Server Component that renders the Ask client. Modify it to read an
   optional `passage` search param and pass it to the `AskPageClient` component.

```tsx
// In page.tsx
type AskPageProps = {
  searchParams: Promise<{ passage?: string }>;
};

export default async function AskPage({ searchParams }: AskPageProps) {
  const params = await searchParams;
  const preloadPassage = typeof params.passage === "string"
    ? decodeURIComponent(params.passage).slice(0, 1000)
    : undefined;

  // ... existing auth checks ...

  return (
    <AskPageClient
      // ... existing props ...
      preloadPassage={preloadPassage}
    />
  );
}
```

**File:** `src/app/ask/page.tsx` (the client component portion, or separate `AskPageClient.tsx`
if it exists as such)

2. Accept `preloadPassage?: string` prop.

3. In `useEffect` on mount (after messages load), if `preloadPassage` is set and the
   conversation is empty, auto-send the following message:

```ts
if (preloadPassage && messages.length === 0) {
  const prompt = `I saved this passage from one of your stories:\n\n"${preloadPassage}"\n\nCan you tell me more about what you were thinking or feeling in this moment?`;
  sendMessage(prompt);
}
```

This fires the Ask endpoint with the passage as context. The conversation opens with that
message already sent, and the streaming response arrives immediately.

**Important:** Add a flag (`preloadFiredRef`) to prevent double-firing in React Strict Mode —
same pattern as `sendInFlightRef` on ask page.

**Checkpoint:** Navigate to `/ask?passage=Some+quote+here` — Ask page opens with the passage
already submitted and Claude responding.

---

### Phase 2: Add "Ask Keith About This" Button to Profile Highlights

**File:** `src/app/profile/highlights/page.tsx`

1. In the highlight card rendering, add an "Ask Keith about this →" link for each highlight:

```tsx
import Link from "next/link";

// Inside the highlight card:
<Link
  href={`/ask?passage=${encodeURIComponent(highlight.passage_text)}`}
  className="inline-flex items-center gap-1 text-xs font-medium text-clay hover:text-clay-mid transition-colors"
>
  Ask Keith about this →
</Link>
```

Place it below the passage text and above (or beside) the "Delete" button.

2. The link opens `/ask` with the passage URL-encoded in the query param. The Ask page
   automatically submits the passage as the first message.

**Checkpoint:** On `/profile/highlights`, each passage has "Ask Keith about this →" link.
Clicking it opens `/ask` with the conversation already in progress.

---

### Phase 3: Polish — Age-Mode Copy

For `young_reader` mode, the auto-generated question should use simpler language:

```ts
const prompt = ageMode === "young_reader"
  ? `I really liked this part from your story:\n\n"${preloadPassage}"\n\nCan you tell me more about it?`
  : `I saved this passage from one of your stories:\n\n"${preloadPassage}"\n\nCan you tell me more about what you were thinking or feeling in this moment?`;
```

The `ageMode` is already available on the Ask page (used for the system prompt). Reuse it here.

**Checkpoint:** With `young_reader` mode active, the auto-sent message uses simpler language.

---

## Content Considerations
- No wiki changes
- The auto-generated prompt is in the code, not a wiki file — keep it brief and warm

## Age-Mode Impact
- `young_reader`: simplified auto-prompt copy (see Phase 3)
- `teen` + `adult`: default "tell me more about what you were thinking" framing

## Testing
- [ ] Build passes
- [ ] Visit `/profile/highlights` — each highlight has "Ask Keith about this →"
- [ ] Click the link — `/ask` opens, message is pre-submitted, streaming response arrives
- [ ] Highlight text appears correctly quoted in the sent message
- [ ] Very long passages (near 1000 chars) are truncated cleanly before encoding
- [ ] Empty `passage` param on `/ask` has no effect (normal empty-state UI shows)
- [ ] React Strict Mode: `preloadFiredRef` prevents double-send in development

## Dependencies
- Requires `/profile/highlights` to exist (IDEA-016, already shipped)
- Requires `/ask` to be functional (already shipped)
- No DB changes
- No migrations

## Estimated Total: 1 hour
(~20 min for ask page preload param, ~20 min for highlights page button, ~20 min for age-mode
copy + testing)
