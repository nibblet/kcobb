import test from "node:test";
import assert from "node:assert/strict";
import { narrationContentHash } from "@/lib/narration/hash";

test("narrationContentHash is stable for same input", () => {
  const text = "Hello. This is a test narration body.";
  assert.equal(narrationContentHash(text), narrationContentHash(text));
});

test("narrationContentHash changes with trimmed canonical differences", () => {
  const a = narrationContentHash("Title. Body one.");
  const b = narrationContentHash("Title. Body two.");
  assert.notEqual(a, b);
});
