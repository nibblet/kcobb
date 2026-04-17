/**
 * Convert markdown story text to speech-friendly plain text.
 * Removes syntax that would be read literally (e.g. "hash hash Title")
 * while preserving narrative content.
 */
export function markdownToSpeech(markdown: string): string {
  let text = markdown;

  // Strip fenced code blocks entirely.
  text = text.replace(/```[\s\S]*?```/g, " ");

  // Strip inline code backticks but keep content.
  text = text.replace(/`([^`]+)`/g, "$1");

  // Strip images entirely (alt text rarely reads well).
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");

  // Links: keep the display text, drop the URL.
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  // Heading markers at line start: remove the leading hashes.
  text = text.replace(/^#{1,6}\s+/gm, "");

  // Blockquote markers at line start.
  text = text.replace(/^>\s?/gm, "");

  // List markers at line start (- + * or "1. ").
  text = text.replace(/^\s*([-+*]|\d+\.)\s+/gm, "");

  // Horizontal rules.
  text = text.replace(/^[-*_]{3,}\s*$/gm, " ");

  // Bold/italic markers: remove the *, ** or _ but keep text.
  text = text.replace(/(\*\*\*|\*\*|\*|___|__|_)([^*_]+)\1/g, "$2");

  // Strip any leftover stray markdown markers that didn't match pairs.
  text = text.replace(/\*\*|__/g, " ");

  // HTML tags (rare in wiki content but strip defensively).
  text = text.replace(/<[^>]+>/g, " ");

  // Collapse whitespace.
  text = text.replace(/\s+/g, " ").trim();

  return text;
}
