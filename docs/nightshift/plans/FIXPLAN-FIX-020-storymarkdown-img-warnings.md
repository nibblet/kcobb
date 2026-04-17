# Fix: [FIX-020] `<img>` ESLint Warnings in StoryMarkdown.tsx

## Problem
`src/components/story/StoryMarkdown.tsx` has two `@next/next/no-img-element` ESLint warnings
(lines 34 and 100). Lint was previously clean; these are a regression introduced when the
lightbox/image rendering component was added.

Impact: lint no longer exits clean; creates noise in CI and nightshift reports.

## Root Cause
`StoryMarkdown.tsx` uses raw `<img>` at two points:

1. **Line 34** — inline story image (clickable thumbnail inside `ReactMarkdown` custom renderer)
2. **Line 100** — lightbox full-size image

`next/image` is impractical here because:
- Images come from dynamic `src` strings extracted from markdown at runtime
- Dimensions are not known at compile time
- `next/image` with `fill` requires a positioned wrapper with explicit pixel height — incompatible
  with the prose typography container
- The 35 book images are already small (< 25 KB each) and served from `/public/book-images/`
  with `loading="lazy"` already in place

The correct resolution is targeted ESLint suppression with a comment explaining the rationale,
not a forced migration to `next/image`.

## Steps

1. Open `src/components/story/StoryMarkdown.tsx`

2. **Line 33** (just before the `<img` at line 34) — add the suppression comment:

**Before:**
```tsx
            return (
              <img
                src={src}
                alt={imageAlt}
```

**After:**
```tsx
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={imageAlt}
```

3. **Line 99** (just before the `<img` at line 100) — add the suppression comment:

**Before:**
```tsx
            <div className="max-h-[88vh] overflow-auto rounded-lg bg-black/30 p-1">
              <img
                src={activeImage.src}
```

**After:**
```tsx
            <div className="max-h-[88vh] overflow-auto rounded-lg bg-black/30 p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage.src}
```

4. Run `npm run lint` — confirm 0 warnings, 0 errors (FIX-019 also still needs fixing; confirm
   both are gone if FIX-019 has been applied, or 1 remaining if not).

## Files Modified
- `src/components/story/StoryMarkdown.tsx` — add two eslint-disable-next-line comments

## New Files
None.

## Database Changes
None.

## Verify
- [ ] `npm run lint` exits with 0 warnings for `StoryMarkdown.tsx`
- [ ] `npm run build` still passes
- [ ] Story page with a book image still renders the inline image and opens the lightbox
