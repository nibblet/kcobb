# Dev Plan: [IDEA-027] "What to Read Next" — Story Momentum After Reading

## What This Does
The story detail page footer currently has two CTAs: "Chat about this story (AI)" and "Browse more stories". The second CTA sends readers to the flat story list, killing reading momentum. This plan replaces it with a specific "What to Read Next" suggestion: the next memoir story in sequence if unread, OR a thematically related story if the next-in-sequence was already read.

This turns the end of every story into an invitation to keep reading, rather than a dead end.

## User Stories
- As a grandchild finishing a story, I want to be shown the obvious next story, so I keep reading instead of getting lost in the library.
- As an adult who's already read many stories, I want to see a thematically connected story I haven't read yet, so I can explore non-linearly.
- As a young reader, I want to see "What comes next in Grandpa's book" so the memoir feels like a continuous story.

## Implementation

### Phase 1: Compute "what's next" in page.tsx (15 min)
1. Open `src/app/stories/[storyId]/page.tsx`
2. After the existing `relatedStories` fetch, add logic to compute the next suggestion:
   ```ts
   import { getAllStories } from "@/lib/wiki/parser";

   // Get all memoir stories in sequence order
   const allMemoirStories = getAllStories()
     .filter(s => s.source === "memoir")
     .sort((a, b) => a.id.localeCompare(b.id));
   
   // Find this story's index in the memoir sequence
   const currentIdx = allMemoirStories.findIndex(s => s.id === storyId);
   const nextInSequence = currentIdx >= 0 && currentIdx < allMemoirStories.length - 1
     ? allMemoirStories[currentIdx + 1]
     : null;
   
   // Already-read story IDs (user is already fetched above)
   let readStoryIds: Set<string> = new Set();
   if (user) {
     const { data: reads } = await supabase
       .from("sb_story_reads")
       .select("story_id")
       .eq("user_id", user.id);
     if (reads) readStoryIds = new Set(reads.map(r => r.story_id));
   }
   
   // Decision: next-in-sequence if unread; else first unread related story; else next-in-sequence anyway
   let whatToReadNext: { id: string; title: string; summary: string; reason: string } | null = null;
   
   if (nextInSequence && !readStoryIds.has(nextInSequence.id)) {
     whatToReadNext = { id: nextInSequence.id, title: nextInSequence.title, summary: nextInSequence.summary, reason: "next" };
   } else {
     // Try related stories (unread first)
     const unreadRelated = relatedStories.find(({ relId, story: rel }) => rel && !readStoryIds.has(relId));
     if (unreadRelated?.story) {
       whatToReadNext = { id: unreadRelated.relId, title: unreadRelated.story.title, summary: unreadRelated.story.summary, reason: "related" };
     } else if (nextInSequence) {
       // All related stories read — fall back to next in sequence
       whatToReadNext = { id: nextInSequence.id, title: nextInSequence.title, summary: nextInSequence.summary, reason: "next" };
     }
   }
   ```

### Phase 2: WhatToReadNext component (15 min)
Create `src/components/story/WhatToReadNext.tsx`:
```tsx
import Link from "next/link";

type Props = {
  id: string;
  title: string;
  summary: string;
  reason: "next" | "related";
  ageMode?: string;
};

export function WhatToReadNext({ id, title, summary, reason, ageMode }: Props) {
  const label =
    reason === "next"
      ? ageMode === "young_reader" ? "What comes next in the book" : "Continue reading"
      : ageMode === "young_reader" ? "A connected story" : "Connected story";

  return (
    <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-warm-white p-5">
      <p className="type-meta mb-2 text-ink-ghost uppercase tracking-wide">{label}</p>
      <Link
        href={`/stories/${id}`}
        className="group block"
      >
        <h3 className="type-ui font-semibold text-ink group-hover:text-burgundy transition-colors">
          {title}
        </h3>
        <p className="mt-1 font-[family-name:var(--font-lora)] text-sm leading-relaxed text-ink-muted line-clamp-2">
          {summary}
        </p>
        <span className="type-ui mt-2 inline-block text-sm text-clay group-hover:underline underline-offset-2">
          Read this story →
        </span>
      </Link>
    </div>
  );
}
```

### Phase 3: Wire into story page footer (10 min)
1. Back in `src/app/stories/[storyId]/page.tsx`, import `WhatToReadNext`
2. Replace the footer "Browse more stories" CTA with the new component + a smaller secondary link:
   ```tsx
   {/* What to read next */}
   {whatToReadNext && (
     <WhatToReadNext {...whatToReadNext} />
   )}

   {/* Footer CTAs */}
   <div className="mt-6 flex flex-col gap-3 border-t border-[var(--color-divider)] pt-6 sm:flex-row sm:items-start">
     <div className="flex min-w-0 flex-1 flex-col gap-1">
       <Link
         href={`/ask?story=${storyId}`}
         className="rounded-lg bg-clay py-2.5 text-center text-sm font-medium text-warm-white transition-colors hover:bg-clay-mid"
       >
         Chat about this story (AI)
       </Link>
     </div>
     {!whatToReadNext && (
       <Link
         href="/stories"
         className="flex-1 rounded-lg border border-[var(--color-border)] bg-warm-white py-2.5 text-center text-sm font-medium text-ink transition-colors hover:border-clay-border sm:max-w-[12rem] sm:self-center"
       >
         Browse all stories
       </Link>
     )}
   </div>
   ```
   (When `whatToReadNext` is shown, "Browse all stories" is omitted — the specific suggestion is better. When no suggestion available, keep the browse link.)

**Checkpoint:** After reading a story, the reader sees a specific "Continue reading" or "Connected story" suggestion. The footer no longer just dumps them at the story list.

## Content Considerations
- Only memoir stories (`source === "memoir"`) participate in the "next in sequence" logic
- Interview stories (`source === "interview"`) don't have a sequence — they'll show related stories or no "next" suggestion
- Family-contributed stories (V2+) don't have a sequence either — same fallback

## Age-Mode Impact
- `young_reader`: "What comes next in the book" / "A connected story"
- `teen`/`adult`: "Continue reading" / "Connected story"
- Pass `ageMode` from `useAgeMode()` — but since this is a server component, read it from the server DB query (already fetched in `getInitialDisplayModes`). OR make `WhatToReadNext` a client component that reads `useAgeMode()` directly.

**Simpler approach**: Make `WhatToReadNext` a client component with `useAgeMode()` hook. Server component passes `id`, `title`, `summary`, `reason`. Client component handles the label text.

## Testing
- [ ] Build passes
- [ ] Memoir story with an unread next story: shows "Continue reading" → correct next story
- [ ] Memoir story where next story is already read: shows first unread related story
- [ ] Last memoir story (P1_S39): no next-in-sequence; shows related or nothing
- [ ] Interview story: no sequence; shows related or nothing
- [ ] Unauthenticated user: no "what's next" (graceful, `readStoryIds` is empty Set; shows next-in-sequence unconditionally since all are "unread")

## Dependencies
- No new DB tables or migrations needed
- `sb_story_reads` already exists
- `story.relatedStoryIds` already on every story

## Estimated Total: 40–50 min
