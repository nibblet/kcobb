import { getAllStories, getAllThemes, type WikiStory, type WikiTheme } from "./parser";

export interface GraphThemeNode {
  id: string; // theme slug
  kind: "theme";
  name: string;
  storyCount: number;
}

export interface GraphStoryNode {
  id: string; // story id e.g. P1_S06
  kind: "story";
  title: string;
  summary: string;
  slug: string;
  themeCount: number;
}

export type GraphNode = GraphThemeNode | GraphStoryNode;

export interface GraphLink {
  source: string; // theme slug
  target: string; // story id
}

export interface ThemeGraph {
  themes: GraphThemeNode[];
  stories: GraphStoryNode[];
  links: GraphLink[];
}

export interface ChordMatrix {
  themes: { slug: string; name: string; storyCount: number }[];
  /** size [n][n], matrix[i][j] = number of stories that share theme i AND theme j */
  matrix: number[][];
}

/** Convert a theme display name like "Financial Responsibility" -> "financial-responsibility" */
export function slugifyTheme(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function storyThemeSlugs(
  story: WikiStory,
  knownThemeSlugs: Set<string>
): string[] {
  return story.themes
    .map(slugifyTheme)
    .filter((s) => knownThemeSlugs.has(s));
}

export function buildThemeGraph(): ThemeGraph {
  const rawThemes = getAllThemes();
  const rawStories = getAllStories();
  const knownThemeSlugs = new Set(rawThemes.map((t) => t.slug));

  const themes: GraphThemeNode[] = rawThemes.map((t) => ({
    id: t.slug,
    kind: "theme" as const,
    name: t.name,
    storyCount: t.storyCount,
  }));

  const stories: GraphStoryNode[] = [];
  const links: GraphLink[] = [];

  for (const s of rawStories) {
    const themeSlugs = storyThemeSlugs(s, knownThemeSlugs);
    if (themeSlugs.length === 0) continue;

    stories.push({
      id: s.storyId,
      kind: "story",
      title: s.title,
      summary: s.summary,
      slug: s.slug,
      themeCount: themeSlugs.length,
    });

    for (const themeSlug of themeSlugs) {
      links.push({ source: themeSlug, target: s.storyId });
    }
  }

  return { themes, stories, links };
}

/**
 * Build a theme × theme co-occurrence matrix: matrix[i][j] = number of stories
 * tagged with BOTH theme i and theme j. The diagonal is each theme's total
 * story count (it co-occurs with itself in every story that has it).
 */
export function buildChordMatrix(): ChordMatrix {
  const rawThemes = getAllThemes();
  const rawStories = getAllStories();
  const knownThemeSlugs = new Set(rawThemes.map((t) => t.slug));

  const themes = rawThemes.map((t) => ({
    slug: t.slug,
    name: t.name,
    storyCount: t.storyCount,
  }));

  const slugToIdx = new Map(themes.map((t, i) => [t.slug, i]));
  const n = themes.length;
  const matrix: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => 0)
  );

  for (const s of rawStories) {
    const slugs = s.themes.map(slugifyTheme).filter((x) => knownThemeSlugs.has(x));
    const idxs = slugs
      .map((sl) => slugToIdx.get(sl))
      .filter((x): x is number => typeof x === "number");

    for (const i of idxs) {
      for (const j of idxs) {
        matrix[i][j] += 1;
      }
    }
  }

  return { themes, matrix };
}

// Re-exports for convenience
export type { WikiTheme, WikiStory };
