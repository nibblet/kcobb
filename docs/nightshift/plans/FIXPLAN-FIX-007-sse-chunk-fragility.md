# Fix: [FIX-007] SSE Stream Chunk Parsing Fragility in Ask Page

## Problem
The Ask page's streaming response handler (`src/app/ask/page.tsx`, lines 77-82) splits incoming chunks on newlines and JSON-parses each `data:` prefixed line. This is fragile: TCP packets (and therefore fetch `ReadableStream` chunks) don't respect SSE line boundaries. A chunk can arrive mid-line, causing `JSON.parse(line.slice(6))` to throw a `SyntaxError`, which propagates to the outer `catch` block that removes the assistant placeholder and shows a generic error — even if the response was partially delivered.

Impact: Intermittent chat failures under normal use, more likely on slow or mobile connections. Error appears even when Claude successfully begins responding.

## Root Cause
`src/app/ask/page.tsx:73-103`:
```ts
const chunk = decoder.decode(value);
const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
for (const line of lines) {
  const data = JSON.parse(line.slice(6));  // throws if line is truncated
  ...
}
```

The fix is to maintain a text buffer across chunks and only parse complete lines (those ending with `\n`).

## Steps

1. Open `src/app/ask/page.tsx`
2. Add a `buffer` variable before the `while (true)` loop:
   ```ts
   let buffer = "";
   while (true) {
   ```
3. Replace the chunk processing block (currently lines 77-103 inside the while loop):

   **Before:**
   ```ts
   const chunk = decoder.decode(value);
   const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

   for (const line of lines) {
     const data = JSON.parse(line.slice(6));

     if (data.error) {
       setError(data.error);
       break;
     }

     if (data.conversationId && !conversationId) {
       setConversationId(data.conversationId);
     }

     if (data.text) {
       setMessages((prev) => {
         const updated = [...prev];
         const last = updated[updated.length - 1];
         if (last.role === "assistant") {
           last.content += data.text;
         }
         return updated;
       });
     }
   }
   ```

   **After:**
   ```ts
   buffer += decoder.decode(value, { stream: true });
   const lines = buffer.split("\n");
   // Keep the last (potentially incomplete) line in the buffer
   buffer = lines.pop() ?? "";

   for (const line of lines) {
     if (!line.startsWith("data: ")) continue;
     try {
       const data = JSON.parse(line.slice(6));

       if (data.error) {
         setError(data.error);
         break;
       }

       if (data.conversationId && !conversationId) {
         setConversationId(data.conversationId);
       }

       if (data.text) {
         setMessages((prev) => {
           const updated = [...prev];
           const last = updated[updated.length - 1];
           if (last.role === "assistant") {
             last.content += data.text;
           }
           return updated;
         });
       }
     } catch {
       // Malformed SSE line — skip silently
     }
   }
   ```

   Key changes:
   - `decoder.decode(value, { stream: true })` — proper streaming decode that handles multi-byte chars split across chunks
   - `lines.pop()` — keeps the incomplete trailing line in the buffer
   - Individual `try/catch` per line — a bad line doesn't abort the whole stream
   - Buffer accumulates until complete newline-terminated lines are available

4. Run `npm run build` to verify no TypeScript errors
5. Test: open Ask Keith and send a message — it should stream normally
6. To simulate fragility: not easily done without network throttling, but the logic is simple enough to review manually

**Done 2026-04-13:** Buffered lines + `decode(value, { stream: true })`, flush with `decode()` when `done`, per-line try/catch.

## Files Modified
- `src/app/ask/page.tsx` — Add buffer accumulation + per-line try/catch in stream reader

## New Files (if any)
None.

## Database Changes (if any)
None.

## Verify
- [x] Build passes
- [ ] Ask Keith streams responses correctly on a normal connection *(manual)*
- [ ] Ask Keith handles a failed stream gracefully (placeholder removed, error shown) *(manual)*
- [ ] No console errors during normal streaming *(manual)*
