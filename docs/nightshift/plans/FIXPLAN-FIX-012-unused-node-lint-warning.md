# Fix: [FIX-012] Unused `_node` Prop in Ask Page Markdown Components

## Problem
`src/app/ask/page.tsx` line 10 produces an ESLint warning:
```
'_node' is defined but never used  @typescript-eslint/no-unused-vars
```

The `ASSISTANT_MARKDOWN_COMPONENTS` definition destructures `node` as `_node` (a common
pattern for intentionally unused destructured variables), but the ESLint config's unused-vars
rule doesn't recognize the `_node` naming convention — only `_` exactly or a stricter prefix
pattern.

## Root Cause
`src/app/ask/page.tsx`, lines 9–11:
```ts
const ASSISTANT_MARKDOWN_COMPONENTS: Components = {
  a({ href, children, node: _node, ...props }) {
```

`node` is a prop passed by react-markdown to custom components. It contains AST node data.
It's destructured (to prevent it spreading into the `<a>` tag via `...props`) but never used.
The `_node` alias doesn't suppress the ESLint warning with the current config.

## Steps

### 1. Open `src/app/ask/page.tsx`

On line 10, change:
```ts
a({ href, children, node: _node, ...props }) {
```
To:
```ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
a({ href, children, node: _, ...props }) {
```

Or alternatively — since `node` only needs to be excluded from `...props`, use the `node: _`
single underscore pattern (most configs whitelist `_` exactly):

```ts
a({ href, children, node: _, ...props }) {
```

Check if `_` alone is whitelisted: if lint still warns, add a single `eslint-disable-next-line`
comment. Do NOT add a file-level disable.

### 2. Run `npm run lint` to confirm 0 warnings

## Files Modified
- `src/app/ask/page.tsx` — rename `_node` to `_` (or add eslint-disable-next-line)

## Verify
- [ ] `npm run lint` reports 0 problems
- [ ] Build passes
