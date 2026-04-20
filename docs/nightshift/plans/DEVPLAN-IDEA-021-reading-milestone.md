# Dev Plan: [IDEA-021] Reading Milestone Celebration

## What This Does
When a family member reads their 39th (final) memoir story — completing the full arc of Keith's life as told in the book — a fullscreen celebration moment appears. The message is warm, personal, and age-aware: "You've walked Grandpa's full journey" for young readers; a more reflective "You've read every story Keith told." for adults.

The `sb_story_reads` tracking infrastructure is already in place. The `/api/stories/[storyId]/read` endpoint already upserts the read row. This plan layers a milestone detection and celebration overlay on top of that existing infra.

**Note:** Requires FIX-027 (duplicate P1_S02 deletion) to be applied first. Without that fix, `memoirStoryCount` in the API returns a max of 39 but `storiesData` still has 40 memoir entries, so the milestone trigger math is off by one.

## User Stories
- As a grandchild reading the storybook, I want a special moment when I finish all 39 stories so I feel the significance of that achievement.
- As a parent watching a child read, I want a celebratory screen they can share and remember.
- As an adult family member, I want a quiet, reflective completion message — not confetti, but a meaningful mark.

## Implementation

### Phase 1: Milestone Detection in API

1. Open `src/app/api/stories/[storyId]/read/route.ts`

2. After the existing upsert, add a count query for this user's memoir reads:
   ```ts
   const { count: memoirReadCount } = await supabase
     .from("sb_story_reads")
     .select("story_id", { count: "exact", head: true })
     .eq("user_id", user.id)
     .like("story_id", "P1_%");
   ```

3. Determine if this is the milestone moment:
   ```ts
   const MEMOIR_TOTAL = 39;
   const milestoneReached =
     (memoirReadCount ?? 0) === MEMOIR_TOTAL && storyId.startsWith("P1_");
   ```

4. Return the count in the JSON response:
   ```ts
   return NextResponse.json({ ok: true, memoirReadCount: memoirReadCount ?? 0, milestoneReached });
   ```

   **Checkpoint:** POST `/api/stories/[storyId]/read` now returns `{ ok: true, memoirReadCount: N, milestoneReached: bool }`.

### Phase 2: ReadTracker Fires Milestone Callback

1. Open `src/components/story/ReadTracker.tsx`

2. Add an optional `onMilestone` prop:
   ```tsx
   type Props = { storyId: string; onMilestone?: () => void };
   ```

3. After the fetch resolves, check the response:
   ```tsx
   const data = await res.json();
   if (data.milestoneReached) {
     // Only fire once per session via localStorage
     const key = "kcobb_memoir_milestone_shown";
     if (!localStorage.getItem(key)) {
       localStorage.setItem(key, "1");
       onMilestone?.();
     }
   }
   ```

   **Checkpoint:** When the API returns `milestoneReached: true`, `onMilestone` fires (once per device).

### Phase 3: MilestoneOverlay Component

1. Create `src/components/story/MilestoneOverlay.tsx` — fullscreen overlay, similar pattern to `PhotoFrameOverlay.tsx`:
   ```tsx
   "use client";
   import { useEffect } from "react";
   import { useAgeMode } from "@/hooks/useAgeMode";

   type Props = { onClose: () => void };

   const MESSAGES = {
     young_reader: {
       headline: "You read ALL of Grandpa's stories!",
       body: "Every single one. You've walked the full journey of Grandpa Keith's life — from growing up in Mississippi all the way to today.",
     },
     teen: {
       headline: "You've read every story.",
       body: "All 39 chapters of Grandpa Keith's life. From the red clay hills to the corner office — you've heard it all.",
     },
     adult: {
       headline: "You've read Keith's complete memoir.",
       body: "All 39 stories. The full arc of a remarkable life — from a small Mississippi town to the boardrooms of KPMG, Alamo, and the Federal Reserve.",
     },
   };

   export function MilestoneOverlay({ onClose }: Props) {
     const { ageMode } = useAgeMode();
     const msg = MESSAGES[ageMode];

     useEffect(() => {
       const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
       window.addEventListener("keydown", handler);
       return () => window.removeEventListener("keydown", handler);
     }, [onClose]);

     return (
       <div
         className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#1a1108]/95 px-8 text-center"
         onClick={onClose}
       >
         <div className="max-w-lg" onClick={(e) => e.stopPropagation()}>
           <p className="mb-4 font-[family-name:var(--font-lora)] text-5xl text-gold">✓</p>
           <h2 className="mb-4 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[#f0e8d5]">
             {msg.headline}
           </h2>
           <p className="mb-8 font-[family-name:var(--font-lora)] text-lg leading-relaxed text-[rgba(240,232,213,0.75)]">
             {msg.body}
           </p>
           <button
             onClick={onClose}
             className="rounded-lg bg-gold px-6 py-3 font-medium text-[#1a1108] transition-opacity hover:opacity-90"
           >
             Continue reading
           </button>
         </div>
       </div>
     );
   }
   ```

   **Checkpoint:** Component renders and closes on button click or Escape.

### Phase 4: Wire into Story Detail Page

1. Open `src/app/stories/[storyId]/page.tsx`

2. This is a server component. Create a thin client wrapper `StoryMilestoneGate.tsx`:
   ```tsx
   "use client";
   import { useState } from "react";
   import { ReadTracker } from "@/components/story/ReadTracker";
   import { MilestoneOverlay } from "@/components/story/MilestoneOverlay";

   export function StoryMilestoneGate({ storyId }: { storyId: string }) {
     const [showMilestone, setShowMilestone] = useState(false);
     return (
       <>
         <ReadTracker storyId={storyId} onMilestone={() => setShowMilestone(true)} />
         {showMilestone && <MilestoneOverlay onClose={() => setShowMilestone(false)} />}
       </>
     );
   }
   ```

3. In `story/[storyId]/page.tsx`, replace `<ReadTracker storyId={storyId} />` with:
   ```tsx
   <StoryMilestoneGate storyId={storyId} />
   ```

   **Checkpoint:** When the 39th memoir story loads for the first time, the overlay appears. Closes on click/Escape. localStorage prevents re-showing.

## Content Considerations
- No wiki changes needed
- Overlay copy lives in the component (3 age modes, already defined above)
- "All 39 stories" number is hardcoded in API and overlay copy — needs updating only if memoir grows

## Age-Mode Impact
- `young_reader`: Celebratory, warm, mentions "Grandpa" directly
- `teen`: Brief, acknowledges the full arc
- `adult`: More reflective, names career landmarks

## Testing
- [ ] Build passes
- [ ] API returns `memoirReadCount` and `milestoneReached` in response body
- [ ] `ReadTracker` fires `onMilestone` when API returns `milestoneReached: true`
- [ ] `localStorage` key prevents re-triggering after first show
- [ ] Overlay renders in all 3 age modes
- [ ] Overlay closes on button click, background click, and Escape key
- [ ] Overlay does NOT appear when reading an interview story (milestoneReached is false for IV_* stories)
- [ ] FIX-027 applied first (39 unique memoir stories in static-data)

## Dependencies
- **Requires FIX-027** — the duplicate P1_S02 must be removed before deploying this, otherwise the milestone can never trigger correctly

## Estimated Total: 1.5 hours
