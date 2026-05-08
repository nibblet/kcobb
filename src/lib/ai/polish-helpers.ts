/**
 * Pure helpers for the Beyond "AI polish" feature. Kept separate from the
 * route handler so they're testable without the Anthropic SDK.
 */

export interface PolishRequestBody {
  title: string;
  body: string;
  life_stage?: string | null;
  year_start?: number | null;
  year_end?: number | null;
  themes?: string[] | null;
  principles?: string[] | null;
  quotes?: string[] | null;
}

export interface PolishSuggestion {
  title?: string;
  body?: string;
  life_stage?: string | null;
  year_start?: number | null;
  year_end?: number | null;
  themes?: string[];
  principles?: string[];
  quotes?: string[];
  rationale?: string;
}

export interface PolishTaxonomy {
  themes?: string[];
  principles?: string[];
}

export function buildUserPrompt(
  input: PolishRequestBody,
  taxonomy?: PolishTaxonomy
): string {
  const lines = [
    "Current draft:",
    "",
    `TITLE: ${input.title || "(empty)"}`,
    `LIFE_STAGE: ${input.life_stage || "(empty)"}`,
    `YEAR_START: ${input.year_start ?? "(empty)"}`,
    `YEAR_END: ${input.year_end ?? "(empty)"}`,
    `THEMES: ${(input.themes ?? []).join(", ") || "(empty)"}`,
    `PRINCIPLES: ${(input.principles ?? []).join(", ") || "(empty)"}`,
    `QUOTES: ${(input.quotes ?? []).join(" | ") || "(empty)"}`,
    "",
    "BODY (may contain HTML from a rich text editor — preserve tags when returning body):",
    input.body || "(empty)",
  ];

  if ((taxonomy?.themes?.length ?? 0) > 0 || (taxonomy?.principles?.length ?? 0) > 0) {
    lines.push(
      "",
      "Use existing archive taxonomy where possible. Prefer selecting from these lists (do not invent new labels unless no reasonable fit exists)."
    );
  }

  if ((taxonomy?.themes?.length ?? 0) > 0) {
    lines.push("", `ALLOWED THEMES: ${(taxonomy?.themes ?? []).join(" | ")}`);
  }

  if ((taxonomy?.principles?.length ?? 0) > 0) {
    lines.push(
      "",
      `ALLOWED PRINCIPLES: ${(taxonomy?.principles ?? []).join(" | ")}`
    );
  }

  return lines.join("\n");
}

/**
 * Extract a JSON object from a raw model response. Tolerates:
 *  - surrounding markdown code fences
 *  - leading/trailing prose
 *  - stray whitespace
 * Returns null when no parseable object is found.
 */
export function extractJSON(text: string): PolishSuggestion | null {
  const cleaned = stripCodeFences(text).trim();
  const direct = tryParseJSON(cleaned);
  if (direct) return direct;

  const objectSlice = extractFirstJSONObject(cleaned);
  if (!objectSlice) return null;

  return tryParseJSON(objectSlice);
}

export function extractJSONFromTextBlocks(
  blocks: string[]
): PolishSuggestion | null {
  const trimmed = blocks.map((b) => b.trim()).filter(Boolean);
  if (trimmed.length === 0) return null;

  // Fast path: model returned one complete JSON payload.
  if (trimmed.length === 1) return extractJSON(trimmed[0]);

  // First try each block independently, then try combined text.
  for (const block of trimmed) {
    const parsed = extractJSON(block);
    if (parsed) return parsed;
  }

  return extractJSON(trimmed.join("\n"));
}

export function alignSuggestionToTaxonomy(
  suggestion: PolishSuggestion,
  allowedThemes: string[],
  allowedPrinciples: string[]
): PolishSuggestion {
  const next: PolishSuggestion = { ...suggestion };

  if (Array.isArray(next.themes)) {
    const mapped = mapToAllowedValues(next.themes, allowedThemes);
    if (mapped.length > 0) next.themes = mapped;
    else delete next.themes;
  }

  if (Array.isArray(next.principles)) {
    const mapped = mapToAllowedValues(next.principles, allowedPrinciples);
    if (mapped.length > 0) next.principles = mapped;
    else delete next.principles;
  }

  return next;
}

export function enforceTaxonomyConfidence(
  alignedSuggestion: PolishSuggestion,
  originalSuggestion: PolishSuggestion
): PolishSuggestion {
  const hadTaxonomyAttempt =
    Array.isArray(originalSuggestion.themes) ||
    Array.isArray(originalSuggestion.principles);
  const matchedCount =
    (alignedSuggestion.themes?.length ?? 0) +
    (alignedSuggestion.principles?.length ?? 0);

  if (!hadTaxonomyAttempt || matchedCount > 0) {
    return alignedSuggestion;
  }

  const note =
    "No confident taxonomy match for themes/principles. Keeping existing groupings unchanged.";
  const rationale = alignedSuggestion.rationale
    ? `${alignedSuggestion.rationale} ${note}`
    : note;

  return {
    ...alignedSuggestion,
    rationale,
    themes: undefined,
    principles: undefined,
  };
}

function stripCodeFences(input: string): string {
  return input
    .replace(/```(?:json)?\s*/gi, "")
    .replace(/```/g, "");
}

function tryParseJSON(input: string): PolishSuggestion | null {
  try {
    return JSON.parse(input) as PolishSuggestion;
  } catch {
    const normalized = normalizeNearJSON(input);
    if (normalized === input) return null;
    try {
      return JSON.parse(normalized) as PolishSuggestion;
    } catch {
      return null;
    }
  }
}

function normalizeNearJSON(input: string): string {
  // Claude occasionally drifts into smart punctuation or trailing commas.
  return input
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();
}

function extractFirstJSONObject(input: string): string | null {
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }

    if (ch === "}") {
      if (depth === 0) continue;
      depth -= 1;
      if (depth === 0 && start >= 0) {
        return input.slice(start, i + 1);
      }
    }
  }

  return null;
}

function mapToAllowedValues(values: string[], allowed: string[]): string[] {
  const byNormalized = new Map<string, string>();
  for (const entry of allowed) {
    byNormalized.set(normalizeLabel(entry), entry);
  }

  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const normalized = normalizeLabel(value);
    const canonical = byNormalized.get(normalized);
    if (!canonical || seen.has(canonical)) continue;
    seen.add(canonical);
    out.push(canonical);
  }

  return out;
}

function normalizeLabel(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
