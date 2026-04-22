import { createHash } from "crypto";

/**
 * Deterministic hash for narration cache keys. Must match the exact string
 * passed to ElevenLabs synthesis (including title prefix).
 */
export function narrationContentHash(canonicalNarrationText: string): string {
  return createHash("sha256")
    .update(canonicalNarrationText.trim(), "utf8")
    .digest("hex");
}
