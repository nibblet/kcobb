export const DEFAULT_MAX_CHUNK_CHARS = 4500;

/**
 * Split prepared plain text into chunks ≤ maxChars, preferring sentence
 * boundaries (. ? !) followed by whitespace. Falls back to word boundaries
 * to avoid breaking mid-word. Never emits empty chunks.
 */
export function chunkTextForSpeech(
  text: string,
  maxChars: number = DEFAULT_MAX_CHUNK_CHARS
): string[] {
  const normalized = text.trim();
  if (!normalized) return [];
  if (normalized.length <= maxChars) return [normalized];

  const chunks: string[] = [];
  let remaining = normalized;

  while (remaining.length > maxChars) {
    const window = remaining.slice(0, maxChars);

    // Prefer sentence break — last ". ", "? ", "! " (or ending).
    const sentenceBreak = Math.max(
      window.lastIndexOf(". "),
      window.lastIndexOf("? "),
      window.lastIndexOf("! "),
      window.lastIndexOf(".\n"),
      window.lastIndexOf("?\n"),
      window.lastIndexOf("!\n")
    );

    let splitAt: number;
    if (sentenceBreak > maxChars * 0.4) {
      // Include the punctuation in the current chunk.
      splitAt = sentenceBreak + 1;
    } else {
      // Fall back to the last whitespace to avoid breaking a word.
      const wsBreak = window.lastIndexOf(" ");
      splitAt = wsBreak > 0 ? wsBreak : maxChars;
    }

    const piece = remaining.slice(0, splitAt).trim();
    if (piece) chunks.push(piece);
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) chunks.push(remaining);

  return chunks;
}
