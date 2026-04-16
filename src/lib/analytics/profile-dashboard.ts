import { createClient } from "@/lib/supabase/server";
import { storiesData } from "@/lib/wiki/static-data";
import { createAdminClient } from "@/lib/supabase/admin";

type StoryMetadata = {
  title: string;
  themes: string[];
  principles: string[];
};

export type ProfileReadingDashboardData = {
  readCount: number;
  mostRecentReadAt: string | null;
  topThemes: { name: string; count: number }[];
  topPrinciples: { text: string; count: number }[];
};

function buildStaticStoryMap(): Map<string, StoryMetadata> {
  return new Map(
    storiesData.map((story) => [
      story.storyId,
      {
        title: story.title,
        themes: story.themes,
        principles: story.principles,
      },
    ])
  );
}

function rankNamedItems(
  items: string[],
  limit: number
): { name: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const item of items) {
    const normalized = item.trim();
    if (!normalized) continue;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, count]) => ({
      name,
      count,
    }));
}

function rankTextItems(
  items: string[],
  limit: number
): { text: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const item of items) {
    const normalized = item.trim();
    if (!normalized) continue;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([text, count]) => ({
      text,
      count,
    }));
}

async function appendPublishedStoryMetadata(
  storyMap: Map<string, StoryMetadata>
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("sb_story_drafts")
      .select("story_id, title, themes, principles")
      .eq("status", "published")
      .not("story_id", "is", null);

    for (const story of data || []) {
      if (!story.story_id) continue;
      storyMap.set(story.story_id, {
        title: story.title,
        themes: story.themes || [],
        principles: story.principles || [],
      });
    }
  } catch {
    // Published-story metadata is additive only; keep static stories if admin env is unavailable.
  }
}

export async function getProfileReadingDashboardData(
  userId: string
): Promise<ProfileReadingDashboardData> {
  const supabase = await createClient();
  const storyMap = buildStaticStoryMap();
  await appendPublishedStoryMetadata(storyMap);

  const { data: reads } = await supabase
    .from("sb_story_reads")
    .select("story_id, read_at")
    .eq("user_id", userId)
    .order("read_at", { ascending: false });

  const safeReads = reads || [];
  const themeHits: string[] = [];
  const principleHits: string[] = [];

  for (const read of safeReads) {
    const story = storyMap.get(read.story_id);
    if (!story) continue;
    themeHits.push(...story.themes);
    principleHits.push(...story.principles);
  }

  return {
    readCount: safeReads.length,
    mostRecentReadAt: safeReads[0]?.read_at ?? null,
    topThemes: rankNamedItems(themeHits, 3),
    topPrinciples: rankTextItems(principleHits, 4),
  };
}
