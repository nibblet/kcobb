import {
  getStoryById,
  getPeopleByStoryId,
  getCanonicalPrinciplesForStory,
  getStoryTimelinePoints,
} from "@/lib/wiki/parser";
import { addPeopleLinks } from "@/lib/wiki/link-people";
import { getCanonicalStoryById } from "@/lib/wiki/corpus";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReadingProgressBar } from "@/components/story/ReadingProgressBar";
import { ReadTracker } from "@/components/story/ReadTracker";
import { FavoriteButton } from "@/components/story/FavoriteButton";
import { ReadBadgeAgeAware } from "@/components/story/ReadBadgeAgeAware";
import { StoryAudioControls } from "@/components/story/StoryAudioControls";
import { StoryMarkdown } from "@/components/story/StoryMarkdown";
import { StoryBodyWithHighlighting } from "@/components/story/StoryBodyWithHighlighting";
import { StoryDetailsDisclosure } from "@/components/story/StoryDetailsDisclosure";
import { StoryTOC, type StoryTOCSection } from "@/components/story/StoryTOC";
import { AnsweredQuestionsList } from "@/components/stories/AnsweredQuestionsList";
import { lifeStageToEraAccent } from "@/lib/design/era";
import { createClient } from "@/lib/supabase/server";
import { PageContextBoundary } from "@/components/layout/PageContextBoundary";
import { WhatsNext } from "@/components/nav/WhatsNext";
import { getStoryWhatsNext } from "@/lib/navigation/whats-next";
import { PrinciplesInlineProse } from "@/components/principles/PrinciplesInlineProse";
import { StoryTimelineStrip } from "@/components/story/StoryTimelineStrip";

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = await params;
  const story = await getCanonicalStoryById(storyId);

  if (!story) notFound();

  const peopleInStory = getPeopleByStoryId(storyId);
  const linkedFullText = addPeopleLinks(story.fullText, peopleInStory);

  const era = lifeStageToEraAccent(story.lifeStage);
  const principlesForStory = getCanonicalPrinciplesForStory(storyId);
  const timelinePoints = getStoryTimelinePoints();
  const supportsListenMode =
    story.source === "memoir" || story.source === "interview";

  // Check if current user has favorited this story
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialFavorited = false;
  let initialRead = false;
  if (user) {
    const { data } = await supabase
      .from("sb_story_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("story_id", storyId)
      .single();
    initialFavorited = !!data;

    const { data: readRow } = await supabase
      .from("sb_story_reads")
      .select("id")
      .eq("user_id", user.id)
      .eq("story_id", storyId)
      .maybeSingle();
    initialRead = !!readRow;
  }

  const tocSections: StoryTOCSection[] = [{ id: "story-body", label: "Story" }];
  if (story.quotes.length > 0)
    tocSections.push({ id: "quotes", label: "Key Quotes" });
  const relatedStories = await Promise.all(
    story.relatedStoryIds.map(async (relId) => ({
      relId,
      story: (await getCanonicalStoryById(relId)) || getStoryById(relId),
    }))
  );

  return (
    <>
      <PageContextBoundary type="story" slug={storyId} title={story.title} />
      <ReadingProgressBar />
      <ReadTracker storyId={storyId} />
      <div className="mx-auto max-w-6xl px-[var(--page-padding-x)] py-6 md:py-10">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-10">
          <div className="min-w-0 max-w-story">
            <Link
              href="/stories"
              className="type-ui mb-4 inline-block text-ink-ghost no-underline transition-colors hover:text-ocean"
            >
              &larr; All Stories
            </Link>

            <div className={`mb-3 border-l-4 pl-4 ${era.accentBorder}`}>
              <h1 className="type-story-title text-balance">{story.title}</h1>
              {(story.sourceDetail || user) && (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {story.sourceDetail && (
                    <p className="type-meta text-ink-ghost">
                      {story.sourceDetail}
                    </p>
                  )}
                  {user && (
                    <div className="flex flex-wrap items-center gap-2">
                      {initialRead && <ReadBadgeAgeAware />}
                      <FavoriteButton
                        storyId={storyId}
                        storyTitle={story.title}
                        initialFavorited={initialFavorited}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="mb-3 font-[family-name:var(--font-lora)] text-base italic leading-relaxed text-ink-muted">
              {story.summary}
            </p>

            <PrinciplesInlineProse
              principles={principlesForStory}
              prefix="Principles in this story include"
            />

            <StoryTimelineStrip
              currentStoryId={storyId}
              points={timelinePoints}
            />

            {supportsListenMode && (
              <StoryAudioControls
                storyId={storyId}
                title={story.title}
                fullText={story.fullText}
                wordCount={story.wordCount}
              />
            )}

            <StoryDetailsDisclosure
              source={story.source}
              lifeStage={story.lifeStage}
              themes={story.themes}
            />

            <div id="story-body">
              {user ? (
                <StoryBodyWithHighlighting
                  storyId={storyId}
                  storyTitle={story.title}
                  fullText={linkedFullText}
                />
              ) : (
                <article className="story-body prose prose-story prose-lg max-w-none pb-8">
                  <StoryMarkdown content={linkedFullText} />
                </article>
              )}
            </div>

            {story.quotes.length > 0 && (
              <div id="quotes" className="mb-6 scroll-mt-32">
                <h2 className="type-meta mb-3 text-ink">Key Quotes</h2>
                <div className="space-y-2">
                  {story.quotes.map((q, i) => (
                    <blockquote
                      key={i}
                      className="border-l-2 border-clay-mid/60 pl-3 font-[family-name:var(--font-lora)] text-sm leading-relaxed text-ink-muted"
                    >
                      {q}
                    </blockquote>
                  ))}
                </div>
              </div>
            )}

            <AnsweredQuestionsList storyId={storyId} />

            <WhatsNext
              floating
              data={getStoryWhatsNext({
                storyId,
                title: story.title,
                relatedStories: relatedStories
                  .filter((r) => r.story)
                  .map((r) => ({
                    storyId: r.relId,
                    title: r.story!.title,
                    summary: r.story!.summary,
                  })),
                firstPrincipleSlug: principlesForStory[0]?.slug ?? null,
                firstPrincipleTitle:
                  principlesForStory[0]?.shortTitle ?? null,
              })}
            />
          </div>

          <StoryTOC sections={tocSections} />
        </div>
      </div>
    </>
  );
}
