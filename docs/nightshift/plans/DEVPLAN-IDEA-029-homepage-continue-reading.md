# Dev Plan: [IDEA-029] Homepage "Continue Reading" Card

## What This Does
The home page currently shows the same static nav cards to every family member, with no awareness of their reading history. This plan adds a personalized "Continue Reading" card that:
- Shows the next unread memoir story for users who've started reading
- Shows a "Start with Story 1" invitation for users who haven't read anything yet
- Shows a "Re-read a favourite" prompt for users who've finished all 39 memoir stories
- Shows nothing for users with no reading data (graceful degradation)

This is the single highest-value personalization for getting family members back into the book. It creates a habit loop: open the app → see exactly where you left off → keep reading.

## User Stories
- As a grandchild who read 5 stories last week, I want to see "Continue reading" when I open the app, so I don't have to search for where I left off.
- As a first-time visitor who hasn't read anything, I want a clear invitation to "Start with Story 1" so I know where to begin.
- As a family member who's finished all 39 memoir stories, I want to see a prompt to revisit a favourite.

## Implementation

### Phase 1: Server-side data (story list + user reads) (10 min)
1. Open `src/app/page.tsx`. Convert to a proper server component that reads both the memoir story list and the user's read history:
   ```ts
   import { getAllStories } from "@/lib/wiki/parser";
   import { createClient } from "@/lib/supabase/server";
   import { HomePageClient } from "@/components/home/HomePageClient";

   export default async function HomePage() {
     // Compute daily quote (from IDEA-026, if implemented)
     const stories = getAllStories();
     const allQuotes = stories.flatMap(s =>
       s.quotes.map(q => ({ quote: q, storyId: s.id, storyTitle: s.title }))
     );
     const now = new Date();
     const dayOfYear = Math.floor(
       (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
     );
     const dailyQuote = allQuotes.length > 0
       ? allQuotes[dayOfYear % allQuotes.length]
       : undefined;

     // Memoir stories only, in sequence order
     const memoirStories = stories
       .filter(s => s.source === "memoir")
       .sort((a, b) => a.id.localeCompare(b.id));

     // Get user's read story IDs
     let readStoryIds: Set<string> = new Set();
     try {
       const supabase = await createClient();
       const { data: { user } } = await supabase.auth.getUser();
       if (user) {
         const { data: reads } = await supabase
           .from("sb_story_reads")
           .select("story_id")
           .eq("user_id", user.id);
         if (reads) {
           readStoryIds = new Set(reads.map(r => r.story_id));
         }
       }
     } catch {
       // Not authenticated or DB unavailable — graceful fallback
     }

     // Find next unread memoir story
     const nextUnread = memoirStories.find(s => !readStoryIds.has(s.id));
     const memoirReadCount = memoirStories.filter(s => readStoryIds.has(s.id)).length;

     const continueReading = readStoryIds.size === 0
       ? null
       : {
           nextUnread: nextUnread ? { id: nextUnread.id, title: nextUnread.title, summary: nextUnread.summary } : null,
           memoirReadCount,
           totalMemoirStories: memoirStories.length,
         };

     return (
       <HomePageClient
         dailyQuote={dailyQuote}
         continueReading={continueReading}
       />
     );
   }
   ```

### Phase 2: ContinueReadingCard component (15 min)
Create `src/components/home/ContinueReadingCard.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useAgeMode } from "@/hooks/useAgeMode";

type ContinueReadingProps = {
  nextUnread: { id: string; title: string; summary: string } | null;
  memoirReadCount: number;
  totalMemoirStories: number;
};

export function ContinueReadingCard({
  nextUnread,
  memoirReadCount,
  totalMemoirStories,
}: ContinueReadingProps) {
  const { ageMode } = useAgeMode();
  const progressText =
    ageMode === "young_reader"
      ? `${memoirReadCount} of ${totalMemoirStories} stories read`
      : `${memoirReadCount} of ${totalMemoirStories} memoir stories`;

  if (!nextUnread) {
    // All stories read
    return (
      <div className="rounded-xl border border-gold bg-gold-pale px-6 py-5">
        <p className="type-meta mb-1 text-gold uppercase tracking-wide">
          {ageMode === "young_reader" ? "You read them all!" : "Complete"}
        </p>
        <p className="type-ui text-ink">
          {ageMode === "young_reader"
            ? "You've read ALL of Grandpa's stories!"
            : "You've read all of Keith's memoir stories."}
        </p>
        <Link
          href="/profile/favorites"
          className="type-ui mt-2 inline-block text-sm text-burgundy hover:underline underline-offset-2"
        >
          Re-read a favourite →
        </Link>
      </div>
    );
  }

  return (
    <Link
      href={`/stories/${nextUnread.id}`}
      className="group block rounded-xl border border-[var(--color-border)] bg-warm-white px-6 py-5 transition-[transform,box-shadow,border-color] duration-[var(--duration-slow)] ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:border-clay-border hover:shadow-[0_12px_40px_rgba(44,28,16,0.08)]"
    >
      <p className="type-meta mb-1 text-ink-ghost uppercase tracking-wide">
        {ageMode === "young_reader" ? "Keep Reading" : "Continue Reading"}
      </p>
      <h3 className="type-story-title mb-1 group-hover:text-burgundy transition-colors">
        {nextUnread.title}
      </h3>
      <p className="font-[family-name:var(--font-lora)] text-sm leading-relaxed text-ink-muted line-clamp-2">
        {nextUnread.summary}
      </p>
      <p className="type-ui mt-3 text-xs text-ink-ghost">{progressText}</p>
    </Link>
  );
}
```

### Phase 3: Wire into HomePageClient (5 min)
1. Open `src/components/home/HomePageClient.tsx`
2. Add `continueReading` prop type and import `ContinueReadingCard`
3. Render `<ContinueReadingCard>` above the nav cards grid when `continueReading` is non-null:
   ```tsx
   {continueReading && (
     <div className="mb-6">
       <ContinueReadingCard {...continueReading} />
     </div>
   )}
   ```

**Checkpoint:** Family members who have read at least one story see a "Continue Reading" card on the home page pointing to their next unread memoir story. First-time visitors see no card (graceful). Users who've finished all 39 stories see a "Re-read a favourite" prompt.

## Content Considerations
- Card only appears for memoir stories (P1_*) — not family-contributed stories (V2+)
- "Start with Story 1" variant: could be a CTA below the nav cards for zero-reads users
  (Optional: add a seed IDEA for this variant if Paul wants it)

## Age-Mode Impact
- `young_reader`: "Keep Reading", "X of Y stories read", "You read them all!"
- `teen`/`adult`: "Continue Reading", "X of Y memoir stories", standard copy

## Testing
- [ ] Build passes
- [ ] User with 0 reads: no Continue Reading card shown (nav cards only)
- [ ] User with 5 reads: shows card for next unread memoir story
- [ ] User with all 39 reads: shows "Re-read a favourite" prompt
- [ ] Link on card navigates to correct story
- [ ] Progress text is accurate
- [ ] Young reader copy shown in young_reader mode

## Dependencies
- If IDEA-026 (Quote of the Day) is implemented first, the `page.tsx` server component can be shared and both features added together.
- No DB changes needed.

## Estimated Total: 30–40 min
