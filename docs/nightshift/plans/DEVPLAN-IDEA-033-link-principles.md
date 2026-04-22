# Dev Plan: [IDEA-033] Link Story Principles to Principle Pages

## What This Does
The "What This Story Shows" sidebar section on every story detail page currently lists Keith's principles as plain text strings. This plan converts them into clickable links pointing to `/principles/[slug]` — the canonical principle detail pages that already exist with full narrative, AI explanation, and related stories. One simple data-fetch in the server component turns a dead-end list into a discovery path through Keith's philosophy.

## User Stories
- As a grandchild reading a story, I want to tap "Build a Relationship Army" to read more about what that means and see all the stories where Keith lived that principle.
- As a teen reader, I want to understand *why* a principle matters, not just see its name.
- As an adult family member, I want to explore Keith's full philosophy from within a story I'm already reading.

## Implementation

### Phase 1: Principle Slug Lookup Helper

Open `src/app/stories/[storyId]/page.tsx`.

Add an import at the top:
```tsx
import { getAllCanonicalPrinciples } from "@/lib/wiki/parser";
```

Add a helper function before the default export:
```ts
function buildPrincipleSlugMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of getAllCanonicalPrinciples()) {
    // Index by slug (for direct hits)
    map.set(p.slug, p.slug);
    // Index by normalized title
    map.set(p.title.toLowerCase().trim(), p.slug);
    // Index by normalized shortTitle
    map.set(p.shortTitle.toLowerCase().trim(), p.slug);
  }
  return map;
}

function getPrincipleSlug(raw: string, map: Map<string, string>): string | null {
  const norm = raw.toLowerCase().trim();
  if (map.has(norm)) return map.get(norm)!;
  // Partial match: raw string contains the slug or title as a substring
  for (const [key, slug] of map) {
    if (norm.includes(key) || key.includes(norm)) return slug;
  }
  return null;
}
```

**Why this approach:** `story.principles` contains raw strings from wiki frontmatter (e.g., "Build Your Relationship Army" vs canonical "Build a Relationship Army"). The normalize + partial-match strategy catches minor phrasing variations without needing to change the wiki source files.

### Phase 2: Build the Map in the Server Component

Inside the `page` async function, after loading `story`, add:
```ts
const principleSlugMap = buildPrincipleSlugMap();
```

This runs server-side at render time. `getAllCanonicalPrinciples()` reads wiki files — same as what the `/principles` page already does.

### Phase 3: Render Principles as Links

Find the existing principle rendering block (around line 157):
```tsx
{story.principles.map((p, i) => (
  <li
    key={i}
    className="flex gap-2 font-[family-name:var(--font-lora)] text-sm text-ink-muted"
  >
    <span className="mt-0.5 text-clay">&#9679;</span>
    {p}
  </li>
))}
```

Replace with:
```tsx
{story.principles.map((p, i) => {
  const slug = getPrincipleSlug(p, principleSlugMap);
  return (
    <li
      key={i}
      className="flex gap-2 font-[family-name:var(--font-lora)] text-sm text-ink-muted"
    >
      <span className="mt-0.5 text-clay">&#9679;</span>
      {slug ? (
        <Link
          href={`/principles/${slug}`}
          className="underline underline-offset-2 decoration-clay/40 hover:decoration-clay hover:text-ink transition-colors"
        >
          {p}
        </Link>
      ) : (
        p
      )}
    </li>
  );
})}
```

`Link` is already imported at the top of the file.

**Checkpoint:** Load any story that has principles. "What This Story Shows" items are now links. Clicking one navigates to the correct `/principles/[slug]` page.

### Phase 4: Verify Matching Quality

Open a few story pages and verify:
- P1_S01 — check its principles link correctly
- P1_S05 — check principles link correctly  
- Any story with an unusual principle phrasing — verify graceful fallback to plain text

If a principle shows up as plain text (no link), the raw string in the wiki didn't match any canonical principle. This is acceptable — the fallback is silent and the user still sees the principle name.

## Content Considerations
- No wiki file changes needed
- No new markdown required
- `getAllCanonicalPrinciples()` is idempotent and read-only
- If Paul adds a new canonical principle to `parser.ts`, links appear automatically for any stories that match

## Age-Mode Impact
- Same link behavior for all age modes — no differentiation needed
- Young readers and teens benefit from clickable discovery paths

## Testing
- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Principles on story pages render as links
- [ ] Clicking a principle link navigates to `/principles/[slug]`
- [ ] Principle detail page loads correctly for the linked slug
- [ ] Unmatched principles still render as plain text (no broken links)
- [ ] No TypeScript errors

## New Files
- None. All changes in `src/app/stories/[storyId]/page.tsx`.

## Dependencies
- `/principles/[slug]` routes must exist (they do — shipped in Run 8)
- `getAllCanonicalPrinciples()` must be importable server-side (it is — used by `/principles/page.tsx`)

## Estimated Total: 20–30 min
