import * as fs from "fs";
import * as path from "path";

const WIKI_DIR = path.join(process.cwd(), "content/wiki");

export type StorySource = "memoir" | "interview" | "family";

export interface WikiStory {
  storyId: string;
  volume: string;
  slug: string;
  title: string;
  summary: string;
  source: StorySource;
  sourceDetail: string;
  lifeStage: string;
  themes: string[];
  wordCount: number;
  fullText: string;
  principles: string[];
  heuristics: string[];
  quotes: string[];
  relatedStoryIds: string[];
  bestUsedWhen: string[];
  timelineEvents: string[];
}

export interface WikiTheme {
  slug: string;
  name: string;
  storyCount: number;
  principles: { text: string; storyId: string }[];
  storyIds: string[];
  stories: { storyId: string; title: string; summary: string }[];
  quotes: { text: string; title: string }[];
}

export type TimelineSource = "memoir" | "public_record" | "interview";

export interface WikiTimelineEvent {
  year: number;
  event: string;
  organization: string;
  location: string;
  storyRef: string;
  /** Path under public/, e.g. /timeline/usm.jpg */
  illustration?: string;
  source: TimelineSource;
  sourceDetail?: string;
}

function readWikiFile(relativePath: string): string {
  const fullPath = path.join(WIKI_DIR, relativePath);
  if (!fs.existsSync(fullPath)) return "";
  return fs.readFileSync(fullPath, "utf-8");
}

function extractSection(content: string, heading: string): string[] {
  const regex = new RegExp(`## ${heading}\\n\\n([\\s\\S]*?)(?=\\n## |\\n---|$)`);
  const match = content.match(regex);
  if (!match) return [];
  return match[1]
    .split("\n")
    .filter((l) => l.startsWith("- ") || l.startsWith("> "))
    .map((l) => l.replace(/^[-*>]\s*/, "").replace(/^"/, "").replace(/"$/, "").trim());
}

function extractMetadata(content: string, key: string): string {
  const regex = new RegExp(`\\*\\*${key}:\\*\\*\\s*(.+)`);
  const match = content.match(regex);
  return match ? match[1].trim() : "";
}

/**
 * Wiki "Full Text" often repeats the H1 title as its own first line; the app already shows `title` in the header.
 */
export function stripDuplicateLeadingTitleFromFullText(
  fullText: string,
  title: string
): string {
  const t = title.trim();
  const trimmed = fullText.trim();
  if (!t || !trimmed) return fullText;

  const nl = trimmed.indexOf("\n");
  const firstLine = (nl === -1 ? trimmed : trimmed.slice(0, nl)).trim();
  if (firstLine !== t) return fullText;

  const afterFirst = nl === -1 ? "" : trimmed.slice(nl + 1);
  return afterFirst.replace(/^\s+/, "");
}

// --- Public API ---

export function getAllStories(): WikiStory[] {
  const dir = path.join(WIKI_DIR, "stories");
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => getStoryFromFile(f))
    .filter(Boolean)
    .sort((a, b) => a!.storyId.localeCompare(b!.storyId)) as WikiStory[];
}

/** Regex that matches any story ID prefix: P1_S01, IV_S01, P2_S01, etc. */
const STORY_ID_RE = /(?:P\d+|IV)_S\d+/;

function deriveSource(storyId: string): { source: StorySource; volume: string } {
  if (storyId.startsWith("IV_")) return { source: "interview", volume: "IV" };
  if (storyId.startsWith("P1_")) return { source: "memoir", volume: "P1" };
  return { source: "family", volume: storyId.match(/^(P\d+)/)?.[1] || "P2" };
}

function getStoryFromFile(filename: string): WikiStory | null {
  const content = readWikiFile(`stories/${filename}`);
  if (!content) return null;

  const storyIdMatch = content.match(
    new RegExp(`\\*\\*Story ID:\\*\\*\\s*(${STORY_ID_RE.source})`)
  );
  if (!storyIdMatch) return null;

  const titleMatch = content.match(/^# (.+)/m);
  const summaryMatch = content.match(/^> (.+)/m);

  const fullTextMatch = content.match(/## Full Text\n\n([\s\S]*?)(?=\n## )/);

  const slug = filename
    .replace(/\.md$/, "")
    .replace(new RegExp(`^${STORY_ID_RE.source}-`), "");

  const { source, volume } = deriveSource(storyIdMatch[1]);
  const sourceDetail = extractMetadata(content, "Source");

  return {
    storyId: storyIdMatch[1],
    volume,
    slug,
    title: titleMatch?.[1] || "",
    summary: summaryMatch?.[1] || "",
    source,
    sourceDetail,
    lifeStage: extractMetadata(content, "Life Stage"),
    themes: extractMetadata(content, "Themes")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    wordCount: parseInt(extractMetadata(content, "Word Count")) || 0,
    fullText: stripDuplicateLeadingTitleFromFullText(
      fullTextMatch?.[1]?.trim() || "",
      titleMatch?.[1] || ""
    ),
    principles: extractSection(content, "What This Story Shows"),
    heuristics: extractSection(content, "If You're Thinking About\\.\\.\\."),
    quotes: extractSection(content, "Key Quotes"),
    relatedStoryIds: extractSection(content, "Related Stories").map(
      (l) => l.match(new RegExp(`\\[\\[(${STORY_ID_RE.source})\\]\\]`))?.[1] || ""
    ).filter(Boolean),
    bestUsedWhen: extractSection(content, "Best Used When Someone Asks About"),
    timelineEvents: extractSection(content, "Timeline"),
  };
}

export function getStoryBySlug(slug: string): WikiStory | null {
  const dir = path.join(WIKI_DIR, "stories");
  if (!fs.existsSync(dir)) return null;

  const file = fs.readdirSync(dir).find((f) => f.includes(slug) && f.endsWith(".md"));
  if (!file) return null;

  return getStoryFromFile(file);
}

export function getStoryById(storyId: string): WikiStory | null {
  const dir = path.join(WIKI_DIR, "stories");
  if (!fs.existsSync(dir)) return null;

  const prefix = `${storyId}-`;
  const file = fs.readdirSync(dir).find((f) => f.startsWith(prefix) && f.endsWith(".md"));
  if (!file) return null;

  return getStoryFromFile(file);
}

export function getAllThemes(): WikiTheme[] {
  const dir = path.join(WIKI_DIR, "themes");
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => getThemeFromFile(f))
    .filter(Boolean)
    .sort((a, b) => b!.storyCount - a!.storyCount) as WikiTheme[];
}

function getThemeFromFile(filename: string): WikiTheme | null {
  const content = readWikiFile(`themes/${filename}`);
  if (!content) return null;

  const titleMatch = content.match(/^# (.+)/m);
  const countMatch = content.match(/\*\*(\d+) stories\*\*/);

  const slug = filename.replace(/\.md$/, "");
  const name = titleMatch?.[1] || slug;

  // Parse stories section
  const storiesRaw = extractSection(content, "Stories");
  const stories = storiesRaw.map((line) => {
    const idMatch = line.match(/\[\[(P\d+_S\d+)\]\]\s*(.+?)(?:\s*—\s*(.+))?$/);
    return {
      storyId: idMatch?.[1] || "",
      title: idMatch?.[2] || "",
      summary: idMatch?.[3] || "",
    };
  }).filter((s) => s.storyId);

  // Parse principles
  const principlesRaw = extractSection(content, "Principles");
  const principles = principlesRaw.map((line) => {
    const match = line.match(/(.+?)\s*_\((P\d+_S\d+)\)_/);
    return { text: match?.[1]?.trim() || line, storyId: match?.[2] || "" };
  });

  // Parse quotes
  const quotesRaw = extractSection(content, "Selected Quotes");
  const quotes = quotesRaw.map((line) => {
    const match = line.match(/"(.+?)"\s*—\s*_(.+?)_/);
    return { text: match?.[1] || line, title: match?.[2] || "" };
  });

  return {
    slug,
    name,
    storyCount: parseInt(countMatch?.[1] || "0") || stories.length,
    principles,
    storyIds: stories.map((s) => s.storyId),
    stories,
    quotes,
  };
}

export function getThemeBySlug(slug: string): WikiTheme | null {
  const dir = path.join(WIKI_DIR, "themes");
  const filepath = path.join(dir, `${slug}.md`);
  if (!fs.existsSync(filepath)) return null;
  return getThemeFromFile(`${slug}.md`);
}

export function getTimeline(): WikiTimelineEvent[] {
  const content = readWikiFile("timeline/career-timeline.md");
  if (!content) return [];

  const events: WikiTimelineEvent[] = [];
  const lines = content.split("\n");

  const storyRefPat = STORY_ID_RE.source;

  for (const line of lines) {
    // Match lines with story refs: **YYYY** — event (org), location — [[ID]] | illustration | source:xxx | detail:xxx
    const match = line.match(
      new RegExp(
        `- \\*\\*(\\d{4})\\*\\* — (.+?)(?:\\s*\\((.+?)\\))?(?:,\\s*(.+?))?\\s*—\\s*\\[\\[(${storyRefPat})\\]\\]\\s*(?:\\|\\s*(.+))?`
      )
    );
    if (match) {
      const trailing = match[6] || "";
      // Parse optional source and detail from trailing pipe-separated fields
      const sourcePart = trailing.match(/source:(\w+)/)?.[1] as TimelineSource | undefined;
      const detailPart = trailing.match(/detail:(.+?)(?:\s*\||$)/)?.[1]?.trim();
      const illustration = trailing
        .replace(/source:\w+/g, "")
        .replace(/detail:.+?(?:\s*\||$)/g, "")
        .replace(/\|/g, "")
        .trim() || undefined;

      events.push({
        year: parseInt(match[1]),
        event: match[2].trim(),
        organization: match[3] || "",
        location: match[4] || "",
        storyRef: match[5],
        illustration: illustration || undefined,
        source: sourcePart || "memoir",
        sourceDetail: detailPart,
      });
    }
  }

  return events;
}

export function getWikiSummaries(): string {
  return readWikiFile("index.md");
}

// --- People ---

export type PersonTier = "A" | "B" | "C" | "D";

export type AiDraftStatus = "none" | "draft" | "reviewed";

export interface WikiPerson {
  slug: string;
  name: string;
  tiers: PersonTier[];
  memoirStoryIds: string[];
  interviewStoryIds: string[];
  note: string;
  body: string;
  aiDraft: string;
  aiDraftStatus: AiDraftStatus;
  aiDraftGeneratedAt: string;
}

function getPersonFromFile(filename: string): WikiPerson | null {
  const content = readWikiFile(`people/${filename}`);
  if (!content) return null;

  const nameMatch = content.match(/^# (.+)/m);
  const slugMatch = content.match(/\*\*Slug:\*\*\s*(.+)/);
  const tiersMatch = content.match(/tiers:\s*([A-D,\s]+)\)/);

  const slug = slugMatch?.[1]?.trim() || filename.replace(/\.md$/, "");
  const tiers = (tiersMatch?.[1] || "")
    .split(",")
    .map((t) => t.trim())
    .filter((t): t is PersonTier => /^[A-D]$/.test(t));

  const memoirSection = content.match(/## Memoir stories\n\n([\s\S]*?)(?=\n## |\n---|\n<!--|$)/);
  const interviewSection = content.match(/## Interview stories\n\n([\s\S]*?)(?=\n## |\n---|\n<!--|$)/);
  const noteSection = content.match(/## Note\n\n([\s\S]*?)(?=\n## |\n---|\n<!--|$)/);

  const aiDraftMatch = content.match(
    /<!-- ai-draft:start(?:\s+generated="([^"]*)")?(?:\s+reviewed="(true|false)")? -->\n([\s\S]*?)\n<!-- ai-draft:end -->/
  );
  const aiDraft = aiDraftMatch?.[3]?.trim() || "";
  const aiDraftGeneratedAt = aiDraftMatch?.[1] || "";
  const aiDraftStatus: AiDraftStatus = aiDraftMatch
    ? aiDraftMatch[2] === "true"
      ? "reviewed"
      : "draft"
    : "none";

  const extractIds = (block: string | undefined): string[] => {
    if (!block) return [];
    const re = new RegExp(`\\((${STORY_ID_RE.source})\\)`, "g");
    const ids: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(block)) !== null) ids.push(m[1]);
    return ids;
  };

  return {
    slug,
    name: nameMatch?.[1]?.trim() || slug,
    tiers,
    memoirStoryIds: extractIds(memoirSection?.[1]),
    interviewStoryIds: extractIds(interviewSection?.[1]),
    note: noteSection?.[1]?.trim() || "",
    body: content,
    aiDraft,
    aiDraftStatus,
    aiDraftGeneratedAt,
  };
}

export function getAllPeople(): WikiPerson[] {
  const dir = path.join(WIKI_DIR, "people");
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => getPersonFromFile(f))
    .filter(Boolean)
    .sort((a, b) => a!.name.localeCompare(b!.name)) as WikiPerson[];
}

export function getPersonBySlug(slug: string): WikiPerson | null {
  const filepath = path.join(WIKI_DIR, "people", `${slug}.md`);
  if (!fs.existsSync(filepath)) return null;
  return getPersonFromFile(`${slug}.md`);
}

export function getPeopleByStoryId(storyId: string): WikiPerson[] {
  return getAllPeople().filter(
    (p) => p.memoirStoryIds.includes(storyId) || p.interviewStoryIds.includes(storyId)
  );
}
