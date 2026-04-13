import * as fs from "fs";
import * as path from "path";

const JOURNEYS_DIR = path.join(process.cwd(), "content/wiki/journeys");

export interface WikiJourney {
  slug: string;
  title: string;
  description: string;
  storyIds: string[];
  storyCount: number;
  ageAppropriate: string[];
  reflections: Record<string, string>;
}

function readFile(relativePath: string): string {
  const fullPath = path.join(JOURNEYS_DIR, relativePath);
  if (!fs.existsSync(fullPath)) return "";
  return fs.readFileSync(fullPath, "utf-8");
}

function extractMetadata(content: string, key: string): string {
  const regex = new RegExp(`\\*\\*${key}:\\*\\*\\s*(.+)`);
  const match = content.match(regex);
  return match ? match[1].trim() : "";
}

function parseJourneyContent(content: string, fallbackSlug: string): WikiJourney | null {
  const titleMatch = content.match(/^# (.+)/m);
  const slug = extractMetadata(content, "Slug") || fallbackSlug;
  const title = titleMatch?.[1]?.trim() || slug;
  const description = extractMetadata(content, "Description");
  const declaredCount = parseInt(extractMetadata(content, "Story Count"), 10);
  const ageRaw = extractMetadata(content, "Age Appropriate");

  const storiesBlock = content.match(/## Stories\s*\n\n([\s\S]*?)(?=\n## |\n*$)/);
  const storyIds: string[] = [];
  if (storiesBlock) {
    for (const line of storiesBlock[1].split("\n")) {
      const m = line.match(/\[\[(P1_S\d+)\]\]/);
      if (m) storyIds.push(m[1]);
    }
  }

  const reflections: Record<string, string> = {};
  const refBlock = content.match(/## Reflections\s*\n\n([\s\S]*?)(?=\n## |\n*$)/);
  if (refBlock) {
    for (const line of refBlock[1].split("\n")) {
      const m = line.match(/^-\s*\[\[(P1_S\d+)\]\]:\s*(.+)$/);
      if (m) reflections[m[1]] = m[2].trim();
    }
  }

  if (storyIds.length === 0) return null;

  const ageAppropriate = ageRaw
    ? ageRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : ["young_reader", "teen", "adult"];

  return {
    slug,
    title,
    description,
    storyIds,
    storyCount: Number.isFinite(declaredCount) && declaredCount > 0 ? declaredCount : storyIds.length,
    ageAppropriate,
    reflections,
  };
}

function parseJourneyFile(filename: string): WikiJourney | null {
  const content = readFile(filename);
  if (!content) return null;
  const fallbackSlug = filename.replace(/\.md$/, "");
  return parseJourneyContent(content, fallbackSlug);
}

export function getAllJourneys(): WikiJourney[] {
  if (!fs.existsSync(JOURNEYS_DIR)) return [];

  return fs
    .readdirSync(JOURNEYS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parseJourneyFile(f))
    .filter(Boolean)
    .sort((a, b) => a!.title.localeCompare(b!.title)) as WikiJourney[];
}

export function getJourneyBySlug(slug: string): WikiJourney | null {
  if (!fs.existsSync(JOURNEYS_DIR)) return null;

  const file = fs.readdirSync(JOURNEYS_DIR).find((f) => {
    if (!f.endsWith(".md")) return false;
    const j = parseJourneyFile(f);
    return j?.slug === slug;
  });

  if (!file) return null;
  return parseJourneyFile(file);
}

export function getJourneySlugs(): string[] {
  return getAllJourneys().map((j) => j.slug);
}
