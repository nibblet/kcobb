import "server-only";

import fs from "node:fs";
import path from "node:path";

const WIKI_DIR = path.join(process.cwd(), "content", "wiki");
const THEMES_DIR = path.join(WIKI_DIR, "themes");
const PEOPLE_DIR = path.join(WIKI_DIR, "people");

function readSlugs(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "index.md")
    .map((f) => f.replace(/\.md$/, ""))
    .sort();
}

let themeCache: string[] | null = null;
let peopleCache: string[] | null = null;

export function getThemeSlugs(): string[] {
  if (!themeCache) themeCache = readSlugs(THEMES_DIR);
  return themeCache;
}

export function getPersonSlugs(): string[] {
  if (!peopleCache) peopleCache = readSlugs(PEOPLE_DIR);
  return peopleCache;
}

export function invalidateWikiSlugCache() {
  themeCache = null;
  peopleCache = null;
}
