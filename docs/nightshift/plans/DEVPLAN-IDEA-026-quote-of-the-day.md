# Dev Plan: [IDEA-026] "Quote of the Day" Home Widget

## What This Does
A small, warm widget on the home page showing a rotating daily quote from Keith's memoir. The quote is selected deterministically by day-of-year, so every family member sees the same quote each day — a natural conversation starter at family gatherings. Each quote links to its source story.

This is a zero-DB, zero-API addition. All quotes are already in the static wiki data (`getAllStories().flatMap(s => s.quotes)`). No server calls needed at runtime.

## User Stories
- As a family member, I want to see a quote from Keith when I visit the home page, so I have something to reflect on or talk about.
- As a grandparent, I want today's quote to be the same as what my grandchild sees, so we can discuss it together.

## Implementation

### Phase 1: Server-side quote selection (5 min)
1. Open `src/app/page.tsx`
2. Change it from a client-only pass-through to a server component that computes the quote:
   ```ts
   import { getAllStories } from "@/lib/wiki/parser";
   import { HomePageClient } from "@/components/home/HomePageClient";

   export default function HomePage() {
     const stories = getAllStories();
     const allQuotes = stories.flatMap(s => 
       s.quotes.map(q => ({ quote: q, storyId: s.id, storyTitle: s.title }))
     );
     if (allQuotes.length === 0) return <HomePageClient />;
     
     const now = new Date();
     const dayOfYear = Math.floor(
       (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
     );
     const dailyQuote = allQuotes[dayOfYear % allQuotes.length];
     
     return <HomePageClient dailyQuote={dailyQuote} />;
   }
   ```

### Phase 2: HomePageClient prop + QuoteWidget (15 min)
1. Open `src/components/home/HomePageClient.tsx`
2. Add `dailyQuote` prop:
   ```ts
   type DailyQuote = { quote: string; storyId: string; storyTitle: string } | undefined;
   
   export function HomePageClient({ dailyQuote }: { dailyQuote?: DailyQuote }) {
   ```
3. Add the `QuoteWidget` below the `<HomeHero />` section and above the nav cards grid:
   ```tsx
   {dailyQuote && (
     <div className="mx-auto max-w-content px-[var(--page-padding-x)] pt-8 pb-0">
       <div className="rounded-xl border border-[var(--color-border)] bg-warm-white px-6 py-5">
         <p className="type-meta mb-2 text-ink-ghost uppercase tracking-wide">
           Today&apos;s Quote
         </p>
         <blockquote className="type-pullquote border-l-[3px] border-clay-mid pl-4 text-base not-italic text-ink-muted mb-3">
           &ldquo;{dailyQuote.quote}&rdquo;
         </blockquote>
         <Link
           href={`/stories/${dailyQuote.storyId}`}
           className="type-ui text-sm text-burgundy hover:underline underline-offset-2"
         >
           From &ldquo;{dailyQuote.storyTitle}&rdquo; →
         </Link>
       </div>
     </div>
   )}
   ```

### Phase 3: Verify and build (2 min)
1. Run `npm run build` — should pass
2. Visit `/` in dev — verify quote appears with today's date
3. Check that Link to story works

**Checkpoint:** Home page shows a daily quote with source attribution. Same quote appears for all users on a given day.

## Content Considerations
- No wiki changes needed — quotes are already in story files
- If `allQuotes.length === 0` (e.g., empty wiki), widget simply doesn't render (graceful)

## Age-Mode Impact
- Widget is age-neutral — quotes are Keith's actual words, appropriate for all ages
- Young readers may not fully understand some quotes but the link to the story is the value

## Testing
- [ ] Build passes
- [ ] Quote appears on home page
- [ ] Link navigates to correct story
- [ ] Different days show different quotes (test by changing `dayOfYear` offset manually)
- [ ] No quote shown if allQuotes is empty (doesn't crash)

## Dependencies
- None. All infra exists.

## Estimated Total: 20–25 min
