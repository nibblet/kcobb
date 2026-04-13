# Dev Plan: [IDEA-003] Age-Aware Ask Keith Suggestion Chips

## What This Does
The Ask Keith page shows 4 suggestion chips when the conversation is empty ("What shaped Keith's leadership style?", etc.). These chips are hardcoded for adult readers. A 6-year-old grandchild in young_reader mode sees the same adult-targeted prompts as a 45-year-old parent.

This plan replaces the hardcoded array with an age-mode-aware lookup. The result: young readers see simple, curious questions ("What was Keith like as a kid?"); teens see relatable questions about decisions and careers; adults see the deeper analytical prompts already there. The `useAgeMode()` hook is already imported in the Ask page — this is a pure frontend change.

## User Stories
- As a young grandchild (young_reader), I want to see questions I can actually understand ("What games did Keith play as a boy?") so I feel like the app is made for me too.
- As a teen family member, I want suggestion chips about career decisions and school so I can ask Keith things relevant to my life.
- As an adult family member, I want the current deep analytical prompts that reference leadership and principles.

## Implementation

### Phase 1: Replace hardcoded chips with age-mode lookup (single file change)

1. Open `src/app/ask/page.tsx`

2. Find the hardcoded suggestions array (currently lines 143-148):
   ```ts
   {[
     "What shaped Keith's leadership style?",
     "Tell me about Keith's early career",
     "What did Keith learn from his father?",
     "What are the most important lessons?",
   ].map((suggestion) => (
   ```

3. Above the `return` statement in `AskPageContent`, add the age-mode-aware suggestions map:
   ```ts
   const SUGGESTIONS: Record<AgeMode, string[]> = {
     young_reader: [
       "What was Keith like as a boy?",
       "Did Keith have any pets growing up?",
       "What games did Keith play when he was little?",
       "What was Keith's favorite thing about school?",
     ],
     teen: [
       "How did Keith decide what to do with his life?",
       "What was Keith's first job like?",
       "How did Keith handle making mistakes?",
       "What advice would Keith give about choosing a career?",
     ],
     adult: [
       "What shaped Keith's leadership style?",
       "Tell me about Keith's early career",
       "What did Keith learn from his father?",
       "What are the most important lessons?",
     ],
   };
   ```

4. Replace the hardcoded array in the JSX:
   ```ts
   // Before:
   {[
     "What shaped Keith's leadership style?",
     "Tell me about Keith's early career",
     "What did Keith learn from his father?",
     "What are the most important lessons?",
   ].map((suggestion) => (

   // After:
   {SUGGESTIONS[ageMode].map((suggestion) => (
   ```

5. Add `AgeMode` to the imports if not already present:
   ```ts
   import type { AgeMode } from "@/types";
   ```
   (Check if `AgeMode` is already imported — the `ageMode` variable from `useAgeMode()` is typed, so it may already be imported indirectly. If not, add it.)

6. **Checkpoint:** Run `npm run dev`, navigate to /ask, and toggle through all three age modes using the switcher. Verify the suggestion chips change. Verify clicking a chip sends the correct message.

### Phase 2: Age-aware empty state copy (optional polish, same file)

7. The empty state text currently says: "What would you like to know about Keith's stories?" This is fine for all modes. Optionally, add a mode-aware variant:
   ```ts
   const EMPTY_STATE_COPY: Record<AgeMode, string> = {
     young_reader: "Ask Keith anything you're curious about!",
     teen: "Ask Keith about his life, choices, or what he'd tell you.",
     adult: "What would you like to know about Keith's stories?",
   };
   ```
   And in JSX: `{EMPTY_STATE_COPY[ageMode]}`

   This is optional — skip if it feels like over-engineering.

8. Run `npm run build` to verify no errors.
9. Run `npm run lint` to verify no new lint issues.

## Content Considerations
- The suggestion questions for `young_reader` and `teen` modes should be grounded in what the memoir actually covers. The young_reader questions above are safe (Keith's childhood is covered in P1_S01 through P1_S05). Teen questions reference career choices which appear in P1_S16 and P1_S17.
- If Paul wants to refine the question sets for any mode, they're a single array edit.

## Age-Mode Impact
- `young_reader`: Sees simple, curiosity-driven questions appropriate for a child
- `teen`: Sees relatable questions about decisions, first jobs, mistakes, career
- `adult`: Sees existing adult-targeted analytical questions (no regression)

## Testing
- [ ] Build passes
- [ ] `/ask` in young_reader mode shows 4 age-appropriate chips
- [ ] `/ask` in teen mode shows 4 teen-appropriate chips
- [ ] `/ask` in adult mode shows original 4 chips (no regression)
- [ ] Clicking any chip in any mode successfully sends the message and gets a Claude response
- [ ] Switching age mode while on the /ask page (before starting a conversation) updates the chips immediately

## Dependencies
None. This is a self-contained frontend change. Can be done independently of all other fixes.

## Estimated Total: 20 minutes
