import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { getPersonSlugs, getThemeSlugs } from "@/lib/wiki/wiki-slugs";
import type { SnippetEra } from "@/lib/snippets";

const ERAS: SnippetEra[] = [
  "childhood",
  "youth",
  "military",
  "career",
  "family",
  "later",
];

const MODEL = "claude-sonnet-4-20250514";

export interface AutoTagResult {
  themes: string[];
  people: string[];
  era: SnippetEra | null;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function autoTagSnippet(text: string): Promise<AutoTagResult> {
  const themeSlugs = getThemeSlugs();
  const personSlugs = getPersonSlugs();

  const system = `You tag short memoir snippets about Keith Cobb (born 1939, accountant turned CEO). Choose tags ONLY from the lists provided. Return STRICT JSON, no prose, no markdown fences.

Allowed themes (use these slugs exactly): ${themeSlugs.join(", ")}
Allowed people (use these slugs exactly): ${personSlugs.join(", ")}
Allowed eras: ${ERAS.join(", ")}

Rules:
- Pick 1-4 themes most directly relevant. Empty array if none clearly fit.
- Pick 0-3 people. Only include a person if they are explicitly named or clearly the subject. Empty array if none.
- Pick exactly one era, or null if unclear. Era heuristic: childhood (pre-college), youth (college/early 20s), military (service years), career (working life through CEO), family (home/marriage/children), later (post-retirement, elder reflection). When ambiguous prefer null.

Return JSON: {"themes": string[], "people": string[], "era": string|null}`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 300,
    system,
    messages: [{ role: "user", content: text }],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    return { themes: [], people: [], era: null };
  }

  const parsed = parseJSON(block.text);
  return {
    themes: filterToList(parsed.themes, themeSlugs),
    people: filterToList(parsed.people, personSlugs),
    era: ERAS.includes(parsed.era as SnippetEra)
      ? (parsed.era as SnippetEra)
      : null,
  };
}

interface RawTags {
  themes?: unknown;
  people?: unknown;
  era?: unknown;
}

function parseJSON(raw: string): RawTags {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(trimmed) as RawTags;
  } catch {
    return {};
  }
}

function filterToList(value: unknown, allowed: string[]): string[] {
  if (!Array.isArray(value)) return [];
  const known = new Set(allowed);
  return Array.from(
    new Set(
      value
        .filter((v): v is string => typeof v === "string")
        .filter((v) => known.has(v))
    )
  );
}
