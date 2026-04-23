import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getPersonSlugs, getThemeSlugs } from "@/lib/wiki/wiki-slugs";

export type SnippetEra =
  | "childhood"
  | "youth"
  | "military"
  | "career"
  | "family"
  | "later";

export type SnippetSource = "capture-tab" | "qa-extract" | "manual";

export interface Snippet {
  id: string;
  slug: string;
  text: string;
  themes: string[];
  people: string[];
  era: SnippetEra | null;
  expandable: boolean;
  source: SnippetSource;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListSnippetsOptions {
  themes?: string[];
  people?: string[];
  era?: SnippetEra;
  expandable?: boolean;
  limit?: number;
}

export async function listSnippets(
  opts: ListSnippetsOptions = {}
): Promise<Snippet[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("sb_snippets")
    .select("*")
    .order("created_at", { ascending: false });

  if (opts.themes?.length) query = query.overlaps("themes", opts.themes);
  if (opts.people?.length) query = query.overlaps("people", opts.people);
  if (opts.era) query = query.eq("era", opts.era);
  if (opts.expandable !== undefined)
    query = query.eq("expandable", opts.expandable);
  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Snippet[];
}

export async function getSnippet(id: string): Promise<Snippet | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sb_snippets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Snippet) ?? null;
}

// Used by the Start Helper: pull snippets relevant to a free-text topic.
// Strategy: match topic tokens against the canonical theme/people slug
// universe, then fetch snippets whose tags overlap. Falls back to recent
// snippets if no tag match is found, so the helper always has some grounding.
export async function getSnippetsForTopic(
  topic: string,
  limit = 5
): Promise<Snippet[]> {
  const tokens = tokenize(topic);
  const themeSlugs = getThemeSlugs();
  const personSlugs = getPersonSlugs();

  const matchedThemes = themeSlugs.filter((slug) => slugMatchesTokens(slug, tokens));
  const matchedPeople = personSlugs.filter((slug) => slugMatchesTokens(slug, tokens));

  if (matchedThemes.length === 0 && matchedPeople.length === 0) {
    return listSnippets({ limit });
  }

  return listSnippets({
    themes: matchedThemes.length ? matchedThemes : undefined,
    people: matchedPeople.length ? matchedPeople : undefined,
    limit,
  });
}

export interface CreateSnippetInput {
  text: string;
  themes?: string[];
  people?: string[];
  era?: SnippetEra | null;
  expandable?: boolean;
  source?: SnippetSource;
  slug?: string;
}

export async function createSnippet(
  input: CreateSnippetInput,
  userId: string | null
): Promise<Snippet> {
  const supabase = createAdminClient();
  const slug = input.slug ?? (await generateUniqueSlug(input.text));
  const themes = filterToKnownThemes(input.themes ?? []);
  const people = filterToKnownPeople(input.people ?? []);

  const { data, error } = await supabase
    .from("sb_snippets")
    .insert({
      slug,
      text: input.text.trim(),
      themes,
      people,
      era: input.era ?? null,
      expandable: input.expandable ?? true,
      source: input.source ?? "manual",
      created_by: userId,
      updated_by: userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Snippet;
}

export interface UpdateSnippetInput {
  text?: string;
  themes?: string[];
  people?: string[];
  era?: SnippetEra | null;
  expandable?: boolean;
}

export async function updateSnippet(
  id: string,
  patch: UpdateSnippetInput,
  userId: string | null
): Promise<Snippet> {
  const supabase = createAdminClient();
  const update: Record<string, unknown> = {
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };
  if (patch.text !== undefined) update.text = patch.text.trim();
  if (patch.themes !== undefined)
    update.themes = filterToKnownThemes(patch.themes);
  if (patch.people !== undefined)
    update.people = filterToKnownPeople(patch.people);
  if (patch.era !== undefined) update.era = patch.era;
  if (patch.expandable !== undefined) update.expandable = patch.expandable;

  const { data, error } = await supabase
    .from("sb_snippets")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Snippet;
}

export async function deleteSnippet(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("sb_snippets").delete().eq("id", id);
  if (error) throw error;
}

// --- helpers ---

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

function filterToKnownThemes(themes: string[]): string[] {
  const known = new Set(getThemeSlugs());
  return Array.from(new Set(themes.filter((t) => known.has(t))));
}

function filterToKnownPeople(people: string[]): string[] {
  const known = new Set(getPersonSlugs());
  return Array.from(new Set(people.filter((p) => known.has(p))));
}

function slugifyText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .join("-")
    .slice(0, 60) || "snippet";
}

async function generateUniqueSlug(text: string): Promise<string> {
  const supabase = createAdminClient();
  const base = slugifyText(text);
  let candidate = base;
  let suffix = 2;
  while (true) {
    const { data, error } = await supabase
      .from("sb_snippets")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}
