/**
 * generate-static-data.ts
 *
 * Reads wiki files and generates a JSON file that client components
 * can import directly. Run after compile-wiki.ts.
 *
 * Run: npx tsx scripts/generate-static-data.ts
 */

import * as fs from "fs";
import * as path from "path";

const WIKI = path.join(process.cwd(), "content/wiki");
const OUT = path.join(process.cwd(), "src/lib/wiki/static-data.ts");

type StorySource = "memoir" | "interview" | "family";

interface StoryCard {
  storyId: string;
  slug: string;
  title: string;
  summary: string;
  source: StorySource;
  sourceDetail: string;
  lifeStage: string;
  themes: string[];
  wordCount: number;
  principles: string[];
}

interface ThemeCard {
  slug: string;
  name: string;
  storyCount: number;
  storyIds: string[];
}

type TimelineSource = "memoir" | "public_record" | "interview";

interface TimelineEvent {
  year: number;
  event: string;
  organization: string;
  location: string;
  storyRef: string;
  illustration?: string;
  source: TimelineSource;
  sourceDetail?: string;
}

/** Matches any story ID: P1_S01, IV_S01, P2_S01, etc. */
const STORY_ID_PAT = "(?:P\\d+|IV)_S\\d+";

function deriveSource(storyId: string): StorySource {
  if (storyId.startsWith("IV_")) return "interview";
  if (storyId.startsWith("P1_")) return "memoir";
  return "family";
}

function extractMetadata(content: string, key: string): string {
  const regex = new RegExp(`\\*\\*${key}:\\*\\*[ \\t]*(.+)`);
  return content.match(regex)?.[1]?.trim() || "";
}

function extractSection(content: string, heading: string): string[] {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`## ${escapedHeading}\\n\\n([\\s\\S]*?)(?=\\n## |\\n---|$)`);
  const match = content.match(regex);
  if (!match) return [];
  return match[1]
    .split("\n")
    .filter((l) => l.startsWith("- "))
    .map((l) => l.replace(/^-\s*/, "").trim());
}

function main() {
  // Stories
  const storiesDir = path.join(WIKI, "stories");
  const storyIdRe = new RegExp(`\\*\\*Story ID:\\*\\*\\s*(${STORY_ID_PAT})`);
  const slugStripRe = new RegExp(`^${STORY_ID_PAT}-`);

  const stories: StoryCard[] = fs
    .readdirSync(storiesDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const content = fs.readFileSync(path.join(storiesDir, f), "utf-8");
      const storyIdMatch = content.match(storyIdRe);
      if (!storyIdMatch) return null;

      const titleMatch = content.match(/^# (.+)/m);
      const summaryMatch = content.match(/^> (.+)/m);
      const slug = f.replace(/\.md$/, "").replace(slugStripRe, "");
      const source = deriveSource(storyIdMatch[1]);

      return {
        storyId: storyIdMatch[1],
        slug,
        title: titleMatch?.[1] || "",
        summary: summaryMatch?.[1] || "",
        source,
        sourceDetail: extractMetadata(content, "Source"),
        lifeStage: extractMetadata(content, "Life Stage"),
        themes: extractMetadata(content, "Themes").split(",").map((t) => t.trim()).filter(Boolean),
        wordCount: parseInt(extractMetadata(content, "Word Count")) || 0,
        principles: extractSection(content, "What This Story Shows"),
        volume: storyIdMatch[1].match(/^(P\d+|IV)/)?.[1] || "P1",
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.storyId.localeCompare(b!.storyId)) as StoryCard[];

  // Themes
  const themesDir = path.join(WIKI, "themes");
  const themes: ThemeCard[] = fs
    .readdirSync(themesDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const content = fs.readFileSync(path.join(themesDir, f), "utf-8");
      const titleMatch = content.match(/^# (.+)/m);
      const countMatch = content.match(/\*\*(\d+) stories\*\*/);
      const slug = f.replace(/\.md$/, "");

      const storiesSection = extractSection(content, "Stories");
      const storyIdExtract = new RegExp(`\\[\\[(${STORY_ID_PAT})\\]\\]`);
      const storyIds = storiesSection
        .map((l) => l.match(storyIdExtract)?.[1])
        .filter(Boolean) as string[];

      return {
        slug,
        name: titleMatch?.[1] || slug,
        storyCount: parseInt(countMatch?.[1] || "0") || storyIds.length,
        storyIds,
      };
    })
    .sort((a, b) => b.storyCount - a.storyCount);

  // Timeline
  const timelineContent = fs.readFileSync(path.join(WIKI, "timeline/career-timeline.md"), "utf-8");
  const timelineEvents: TimelineEvent[] = [];
  const tlRefRe = new RegExp(
    `- \\*\\*(\\d{4})\\*\\* — (.+?)(?:\\s*\\((.+?)\\))?(?:,\\s*(.+?))?\\s*—\\s*\\[\\[(${STORY_ID_PAT})\\]\\]\\s*(?:\\|\\s*(.+))?`
  );
  for (const line of timelineContent.split("\n")) {
    const match = line.match(tlRefRe);
    if (match) {
      const trailing = match[6] || "";
      const sourcePart = trailing.match(/source:(\w+)/)?.[1] as TimelineSource | undefined;
      const detailPart = trailing.match(/detail:(.+?)(?:\s*\||$)/)?.[1]?.trim();
      const illustration = trailing
        .replace(/source:\w+/g, "")
        .replace(/detail:.+?(?:\s*\||$)/g, "")
        .replace(/\|/g, "")
        .trim() || undefined;

      timelineEvents.push({
        year: parseInt(match[1]),
        event: match[2].trim(),
        organization: match[3] || "",
        location: match[4]?.trim() || "",
        storyRef: match[5],
        illustration,
        source: sourcePart || "memoir",
        sourceDetail: detailPart,
      });
    }
  }

  // Write static data module
  const output = `// Auto-generated by scripts/generate-static-data.ts
// Do not edit manually. Run: npx tsx scripts/generate-static-data.ts

export type StorySource = "memoir" | "interview" | "family";
export type TimelineSource = "memoir" | "public_record" | "interview";

export interface StoryCard {
  storyId: string;
  slug: string;
  title: string;
  summary: string;
  source: StorySource;
  sourceDetail: string;
  lifeStage: string;
  themes: string[];
  wordCount: number;
  principles: string[];
  volume?: string;
}

export interface ThemeCard {
  slug: string;
  name: string;
  storyCount: number;
  storyIds: string[];
}

export interface TimelineEvent {
  year: number;
  event: string;
  organization: string;
  location: string;
  storyRef: string;
  illustration?: string;
  source: TimelineSource;
  sourceDetail?: string;
}

export const storiesData: StoryCard[] = ${JSON.stringify(stories, null, 2)};

export const themesData: ThemeCard[] = ${JSON.stringify(themes, null, 2)};

export const timelineData: TimelineEvent[] = ${JSON.stringify(timelineEvents, null, 2)};
`;

  fs.writeFileSync(OUT, output);
  console.log(`✅ Static data generated → ${OUT}`);
  console.log(`   ${stories.length} stories, ${themes.length} themes, ${timelineEvents.length} timeline events`);
}

main();
