# Fix: [FIX-028] useThemeMode setState-in-Effect Lint Error

## Problem
`npm run lint` fails with 1 error:
```
/Volumes/Lexar/kcobb/src/hooks/useThemeMode.tsx
  55:5  error  react-hooks/set-state-in-effect
  Avoid calling setState() directly within an effect
```
This is a regression from the day/night theming commit (`2dfd387`). The lint failure blocks CI confidence and breaks `npm run lint`.

## Root Cause
`src/hooks/useThemeMode.tsx` lines 52–58:
```ts
const [systemMode, setSystemMode] = useState<ThemeResolvedMode>("light");

useEffect(() => {
  setSystemMode(getSystemThemeMode()); // ← triggers lint error, causes cascade render
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  ...
}, []);
```
The `useState` initializer uses a static `"light"` default (SSR-safe) and corrects it in a `useEffect`. This triggers the `react-hooks/set-state-in-effect` rule and also causes a cascade render (effect fires, setState triggers re-render).

The fix: pass `getSystemThemeMode` as a **lazy useState initializer** instead. The function already guards `typeof window === "undefined"`, so:
- Server-side (SSR): returns `"light"` (no window)
- Client-side: returns the actual OS preference

The resolved theme mode is applied to `document.body` only via `BodyModeSync`'s `useEffect`, not in the render output — so there's no hydration mismatch risk.

## Steps

1. Open `src/hooks/useThemeMode.tsx`

2. Change line 52 from:
   ```ts
   const [systemMode, setSystemMode] = useState<ThemeResolvedMode>("light");
   ```
   to:
   ```ts
   const [systemMode, setSystemMode] = useState<ThemeResolvedMode>(getSystemThemeMode);
   ```
   (Pass the function reference as a lazy initializer, not a call)

3. Remove line 55: `setSystemMode(getSystemThemeMode());`
   
   The effect body (lines 54–60) should then be:
   ```ts
   useEffect(() => {
     const mql = window.matchMedia("(prefers-color-scheme: dark)");
     const onChange = () => setSystemMode(mql.matches ? "dark" : "light");
     mql.addEventListener("change", onChange);
     return () => mql.removeEventListener("change", onChange);
   }, []);
   ```

4. Run `npm run lint` — should show 0 problems
5. Run `npm run build` — should pass
6. Run `npm test` — 45 tests should still pass

## Files Modified
- `src/hooks/useThemeMode.tsx` — change `useState("light")` to `useState(getSystemThemeMode)`, remove `setSystemMode(getSystemThemeMode())` from effect

## Verify
- [ ] `npm run lint` → 0 errors, 0 warnings
- [ ] `npm run build` → passes, 55 routes
- [ ] Day mode toggle works (click cycle button, correct icon shown)
- [ ] Night mode applies dark CSS variables to the page
- [ ] Auto mode follows OS preference
