# Dev Plan: [IDEA-017] Original Photos Gallery — Browse the Memoir's Images

## What This Does
35 original photographs from Keith's memoir are now in `/public/book-images/` (added in the
"original photos and user stats" commit). They're currently referenced inline within specific
story pages, revealed as the reader encounters them. But there's no way to browse ALL the photos
from the memoir in one place.

This feature adds a `/gallery` page — a dedicated photo gallery that lets family members browse
all 35 original memoir photos, organized by life era, with the same click-to-enlarge lightbox
already built in `StoryMarkdown.tsx`. It surfaces the visual richness of the archive without
requiring readers to hunt through individual stories.

## User Stories
- As a grandchild, I want to browse all the original photos from Grandpa's memoir so I can see
  his life in pictures without having to read every story first.
- As a family member, I want to click a photo and jump to the story it came from, so photos
  become entry points into the narrative.
- As a parent sharing the storybook with young children, I want a visual starting point so kids
  can connect to the stories through familiar faces and places.

## Implementation

### Phase 1: Photo Data File

Create a static data file that lists all 35 photos with metadata. Derive this from the
`cobb_brain_lab/book_images_manifest.csv` and the story wiki files that reference them.

**New file:** `src/lib/wiki/gallery-photos.ts`

```ts
export type GalleryPhoto = {
  src: string;          // e.g. "/book-images/page-002_img-01_xref-24.jpeg"
  alt: string;          // description for accessibility
  storyId: string | null;  // e.g. "P1_S01" — null if not tied to a specific story
  storyTitle: string | null;
  era: string;          // e.g. "Early Life", "Education", "Career", "Family"
};

export const galleryPhotos: GalleryPhoto[] = [
  // Populated from manifest + wiki file references
  // Example:
  {
    src: "/book-images/page-002_img-01_xref-24.jpeg",
    alt: "Young Keith Cobb",
    storyId: "P1_S01",
    storyTitle: "A Towhead from the Red Clay Hills",
    era: "Early Life",
  },
  // ... all 35 entries
];
```

To populate this file, read `cobb_brain_lab/book_images_manifest.csv` for the full image list,
then cross-reference against wiki story files to identify which story each image appears in
(look for `![...](...xref...)` markdown in wiki files).

Group into 4 eras:
- "Early Life" — childhood/youth stories (P1_S01–P1_S08 range)
- "Education & Service" — school, military, early career (P1_S09–P1_S19 range)
- "Career & Leadership" — business career, major roles (P1_S20–P1_S35 range)
- "Family & Legacy" — family stories, reflection (P1_S33–P1_S39 range)

**Checkpoint:** `gallery-photos.ts` exists with all 35 entries; TypeScript compiles cleanly.

---

### Phase 2: Gallery Page

**New file:** `src/app/gallery/page.tsx`

1. Import `galleryPhotos` from the static data file. Group by `era`.
2. Render a page with a hero section, then one section per era.
3. Within each era section, render a responsive photo grid (3 cols on desktop, 2 on tablet,
   1 on mobile).
4. Each photo cell:
   - Renders the image using `StoryMarkdown`'s lightbox pattern (or extract the lightbox into a
     standalone `PhotoLightbox` component — see Phase 3)
   - Below the image: the story title as a link to that story (if `storyId` is set)
   - Alt text for accessibility

```tsx
import type { Metadata } from "next";
import { galleryPhotos } from "@/lib/wiki/gallery-photos";
import { PhotoGrid } from "@/components/gallery/PhotoGrid";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Original photographs from Keith Cobb's memoir.",
};

export default function GalleryPage() {
  const byEra = Object.groupBy(galleryPhotos, (p) => p.era);
  // ... render era sections
}
```

**Checkpoint:** Visit `/gallery` — photos grouped by era render in a grid.

---

### Phase 3: Extract Reusable Lightbox Component

Currently the lightbox logic lives entirely inside `StoryMarkdown.tsx`. Extract the lightbox
into a standalone component that both `StoryMarkdown.tsx` and the gallery can use.

**New file:** `src/components/story/PhotoLightbox.tsx`

Props:
```ts
type PhotoLightboxProps = {
  src: string;
  alt: string;
  onClose: () => void;
};
```

Update `StoryMarkdown.tsx` to use `<PhotoLightbox>`.
The gallery photo grid also uses `<PhotoLightbox>`.

**Checkpoint:** Lightbox still works on story pages; gallery lightbox opens the same way.

---

### Phase 4: Nav Integration

Add a "Gallery" link to the home page nav cards and/or the `/stories` explore tab.

**File:** `src/app/page.tsx` — add a gallery nav card in the home page grid.
**File:** `src/app/stories/page.tsx` — optionally add a gallery tab or link in the Explore tab.

**Checkpoint:** Home page has a gallery card; clicking it routes to `/gallery`.

---

## Content Considerations
- All images are already in `/public/book-images/` — no new uploads needed
- The `gallery-photos.ts` file is the only new content-adjacent file; it's derived from the
  existing manifest CSV and wiki files
- Alt text for accessibility should describe the subject/context, not just "photo"

## Age-Mode Impact
- Gallery is appropriate for all age modes
- `young_reader`: consider a warmer intro copy ("See the real photos from Grandpa's book!")
- No AI or prompt changes needed

## Testing
- [ ] Build passes
- [ ] `/gallery` renders without errors — all 35 photos displayed
- [ ] Photos grouped correctly into era sections
- [ ] Clicking a photo opens the lightbox; Escape key closes it
- [ ] Story link below each photo navigates to the correct story
- [ ] Mobile: single-column layout renders without overflow
- [ ] All images have descriptive alt text

## Dependencies
- Requires reading `cobb_brain_lab/book_images_manifest.csv` to populate `gallery-photos.ts`
- No DB changes needed
- No migrations needed

## Estimated Total: 2–2.5 hours
(~30 min to populate the data file, ~45 min for gallery page + grid component, ~30 min to
extract lightbox into `PhotoLightbox.tsx`, ~15 min for nav integration)
