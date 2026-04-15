import { createClient } from "@/lib/supabase/server";
import type { WikiStory } from "@/lib/wiki/parser";

/**
 * Fetch published story drafts from Supabase (Volumes 2+).
 * Returns them in the same WikiStory shape as filesystem stories.
 */
export async function getPublishedStories(): Promise<WikiStory[]> {
  const supabase = await createClient();

  const { data: drafts } = await supabase
    .from("sb_story_drafts")
    .select(
      "story_id, title, body, life_stage, year_start, year_end, themes, principles, quotes"
    )
    .eq("status", "published")
    .not("story_id", "is", null)
    .order("story_id", { ascending: true });

  if (!drafts || drafts.length === 0) return [];

  return drafts.map((d) => {
    const volume = d.story_id?.match(/^(P\d+)/)?.[1] || "P2";
    const slug = d.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    return {
      storyId: d.story_id!,
      volume,
      slug,
      title: d.title,
      summary: d.body.slice(0, 200) + (d.body.length > 200 ? "..." : ""),
      source: "family" as const,
      sourceDetail: "",
      lifeStage: d.life_stage || "",
      themes: d.themes || [],
      wordCount: d.body.split(/\s+/).length,
      fullText: d.body,
      principles: d.principles || [],
      heuristics: [],
      quotes: d.quotes || [],
      relatedStoryIds: [],
      bestUsedWhen: [],
      timelineEvents: [],
    };
  });
}

/**
 * Fetch a single published story from Supabase by story_id.
 */
export async function getPublishedStoryById(
  storyId: string
): Promise<WikiStory | null> {
  const supabase = await createClient();

  const { data: draft } = await supabase
    .from("sb_story_drafts")
    .select(
      "story_id, title, body, life_stage, year_start, year_end, themes, principles, quotes"
    )
    .eq("story_id", storyId)
    .eq("status", "published")
    .single();

  if (!draft) return null;

  const volume = draft.story_id?.match(/^(P\d+)/)?.[1] || "P2";
  const slug = draft.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    storyId: draft.story_id!,
    volume,
    slug,
    title: draft.title,
    summary:
      draft.body.slice(0, 200) + (draft.body.length > 200 ? "..." : ""),
    source: "family" as const,
    sourceDetail: "",
    lifeStage: draft.life_stage || "",
    themes: draft.themes || [],
    wordCount: draft.body.split(/\s+/).length,
    fullText: draft.body,
    principles: draft.principles || [],
    heuristics: [],
    quotes: draft.quotes || [],
    relatedStoryIds: [],
    bestUsedWhen: [],
    timelineEvents: [],
  };
}
