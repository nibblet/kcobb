import type { StoryCard } from "@/lib/wiki/static-data";
import { getCanonicalStories } from "@/lib/wiki/corpus";
import { StoriesPageClient } from "./StoriesPageClient";

export default async function StoriesPage() {
  const stories = await getCanonicalStories();
  const storyCards: StoryCard[] = stories.map((story) => ({
    storyId: story.storyId,
    slug: story.slug,
    title: story.title,
    summary: story.summary,
    source: story.source,
    sourceDetail: story.sourceDetail,
    lifeStage: story.lifeStage,
    themes: story.themes,
    wordCount: story.wordCount,
    principles: story.principles,
    volume: story.volume,
  }));

  return <StoriesPageClient stories={storyCards} />;
}
