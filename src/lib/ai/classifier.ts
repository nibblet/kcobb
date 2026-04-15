/**
 * Classifies a user question as "simple" or "deep" to determine
 * whether it benefits from multi-perspective treatment.
 *
 * Simple: factual, list, exploratory questions -> single Sonnet call
 * Deep: advice, guidance, reflection questions -> two perspectives + synthesizer
 *
 * Uses a zero-cost keyword heuristic (no API call).
 */

const DEEP_PATTERNS = [
  // Advice-seeking
  /\bshould\s+i\b/i,
  /\bwhat\s+would\s+keith\b/i,
  /\bwhat\s+would\s+he\b/i,
  /\bhow\s+(do|can|should)\s+i\b/i,
  /\badvice\b/i,
  /\bhelp\s+me\b/i,
  /\bwhat\s+can\s+i\s+learn\b/i,
  /\bhow\s+to\s+deal\s+with\b/i,
  /\bstruggling\s+with\b/i,
  /\bgoing\s+through\b/i,
  /\bfacing\s+a\b/i,

  // Guidance / reflection
  /\bwhat\s+lesson\b/i,
  /\bwhat\s+principle\b/i,
  /\bwhat\s+does\s+(this|that|it)\s+(teach|mean|show)\b/i,
  /\bhow\s+did\s+keith\s+(handle|deal|cope|approach|navigate|decide)\b/i,
  /\bwhat\s+would\s+you\s+(suggest|recommend)\b/i,
  /\bapply\s+(this|that|it)\s+to\b/i,

  // Life decisions
  /\bcareer\s+(change|decision|choice|move)\b/i,
  /\bdifficult\s+(decision|choice|situation|time)\b/i,
  /\bbig\s+decision\b/i,
  /\blife\s+lesson\b/i,
];

export type QuestionDepth = "simple" | "deep";

export function classifyQuestion(
  message: string,
  _history?: { role: string; content: string }[]
): QuestionDepth {
  for (const pattern of DEEP_PATTERNS) {
    if (pattern.test(message)) {
      return "deep";
    }
  }
  return "simple";
}
