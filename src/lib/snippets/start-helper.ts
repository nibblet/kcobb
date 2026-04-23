import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { getCanonicalStories } from "@/lib/wiki/corpus";
import { getPersonSlugs, getThemeSlugs } from "@/lib/wiki/wiki-slugs";
import {
  getSnippet,
  getSnippetsForTopic,
  listSnippets,
  type Snippet,
} from "@/lib/snippets";

const MODEL = "claude-sonnet-4-20250514";

export interface StartHelperInput {
  topic?: string;
  snippetId?: string;
}

export interface StoryReference {
  storyId: string;
  title: string;
  excerpt: string;
}

export interface StartHelperResult {
  intro: string;
  questions: string[];
  topic: string;
  usedSnippets: Snippet[];
  usedStories: StoryReference[];
}

export async function generateStartHelper(
  input: StartHelperInput
): Promise<StartHelperResult> {
  let topic = input.topic?.trim() ?? "";
  let seedSnippet: Snippet | null = null;
  let snippets: Snippet[] = [];

  if (input.snippetId) {
    seedSnippet = await getSnippet(input.snippetId);
    if (seedSnippet) {
      topic = topic || seedSnippet.text;
      snippets = await listSnippets({
        themes: seedSnippet.themes.length ? seedSnippet.themes : undefined,
        people: seedSnippet.people.length ? seedSnippet.people : undefined,
        limit: 6,
      });
      if (!snippets.find((s) => s.id === seedSnippet!.id)) {
        snippets = [seedSnippet, ...snippets];
      }
    }
  } else if (topic) {
    snippets = await getSnippetsForTopic(topic, 5);
  }

  const stories = await findRelevantStories(
    topic,
    seedSnippet?.themes ?? [],
    seedSnippet?.people ?? [],
    3
  );

  const { intro, questions } = await callClaude(topic, snippets, stories);

  return {
    intro,
    questions,
    topic,
    usedSnippets: snippets,
    usedStories: stories,
  };
}

async function findRelevantStories(
  topic: string,
  themes: string[],
  people: string[],
  limit: number
): Promise<StoryReference[]> {
  const stories = await getCanonicalStories();
  const themeSet = new Set(themes);
  const tokens = tokenize(topic);
  const themeSlugs = getThemeSlugs();
  const personSlugs = getPersonSlugs();
  const matchedThemes = new Set(
    themeSlugs.filter((s) => slugMatchesTokens(s, tokens))
  );
  themeSet.forEach((t) => matchedThemes.add(t));
  const peopleSet = new Set(people);
  personSlugs
    .filter((s) => slugMatchesTokens(s, tokens))
    .forEach((s) => peopleSet.add(s));

  const scored = stories
    .map((story) => {
      const themeOverlap = story.themes.filter((t) => matchedThemes.has(t)).length;
      const tokenHits = tokens.filter((t) =>
        story.fullText.toLowerCase().includes(t)
      ).length;
      const peopleHit = Array.from(peopleSet).some((p) =>
        story.fullText.toLowerCase().includes(p.replace(/-/g, " "))
      )
        ? 1
        : 0;
      return {
        story,
        score: themeOverlap * 3 + tokenHits + peopleHit * 2,
      };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ story }) => ({
    storyId: story.storyId,
    title: story.title,
    excerpt: story.summary,
  }));
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

async function callClaude(
  topic: string,
  snippets: Snippet[],
  stories: StoryReference[]
): Promise<{ intro: string; questions: string[] }> {
  const corpus = [
    snippets.length
      ? `Snippets (private memories):\n${snippets
          .map((s) => `- ${s.text}`)
          .join("\n")}`
      : "",
    stories.length
      ? `Related published stories:\n${stories
          .map((s) => `- "${s.title}" (${s.storyId}): ${s.excerpt}`)
          .join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const system = `You are helping Keith Cobb (born 1939) get unstuck on a memoir story. Use the corpus material below to:

1. Write a single short paragraph (2-4 sentences) that opens the topic by referencing what Keith has already shared. If you reference a story, name it in quotes (e.g. "In 'A Would-Be Music Man'..."). Do NOT invent details — only use what's in the corpus.
2. Write 5 open interview questions that would help Keith elaborate on this topic. Questions should be specific (not "tell me more"), invite memory and feeling, and avoid yes/no. They should NOT repeat what he's already said in the corpus.

Return STRICT JSON: {"intro": string, "questions": string[]}. No prose outside the JSON. No markdown fences.

CORPUS:
${corpus || "(no related material yet)"}`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 700,
    system,
    messages: [{ role: "user", content: `Topic: ${topic}` }],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    return { intro: "", questions: [] };
  }
  return parseJSON(block.text);
}

function parseJSON(raw: string): { intro: string; questions: string[] } {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  try {
    const parsed = JSON.parse(trimmed) as {
      intro?: unknown;
      questions?: unknown;
    };
    return {
      intro: typeof parsed.intro === "string" ? parsed.intro : "",
      questions: Array.isArray(parsed.questions)
        ? parsed.questions.filter((q): q is string => typeof q === "string")
        : [],
    };
  } catch {
    return { intro: "", questions: [] };
  }
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

function slugMatchesTokens(slug: string, tokens: string[]): boolean {
  const slugTokens = slug.split("-");
  return tokens.some((t) => slugTokens.includes(t));
}
