import {
  getStoryById,
  getCanonicalPrinciplesForStory,
} from "@/lib/wiki/parser";
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

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = await params;
  const story = await getCanonicalStoryById(storyId);

  if (!story) notFound();

  const era = lifeStageToEraAccent(story.lifeStage);
  const principlesForStory = getCanonicalPrinciplesForStory(storyId);
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
  if (principlesForStory.length > 0)
    tocSections.push({ id: "principles", label: "Principles" });
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
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span
                  className={`type-meta inline-flex items-center rounded-full px-2.5 py-0.5 ${era.badgeClass}`}
                >
                  {story.lifeStage}
                </span>
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
            </div>

            <p className="mb-5 font-[family-name:var(--font-lora)] text-base italic leading-relaxed text-ink-muted">
              {story.summary}
            </p>

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
                  fullText={story.fullText}
                />
              ) : (
                <article className="story-body prose prose-story prose-lg max-w-none pb-8">
                  <StoryMarkdown content={story.fullText} />
                </article>
              )}
            </div>

            {principlesForStory.length > 0 && (
              <div
                id="principles"
                className="mb-6 scroll-mt-32 rounded-xl border border-[var(--color-border)] bg-warm-white p-5"
              >
                <h2 className="type-meta mb-3 text-ink">
                  Principles in this story
                </h2>
                <div className="flex flex-wrap gap-2">
                  {principlesForStory.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/principles#${p.slug}`}
                      className="type-ui rounded-full border border-[var(--color-border)] bg-warm-white-2 px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-clay-border hover:text-clay"
                    >
                      {p.shortTitle}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {story.quotes.length > 0 && (
              <div id="quotes" className="mb-6 scroll-mt-32">
                <h2 className="type-meta mb-3 text-ink">Key Quotes</h2>
                <div className="space-y-3">
                  {story.quotes.map((q, i) => (
                    <blockquote
                      key={i}
                      className="type-pullquote border-l-[3px] border-clay-mid pl-4 text-base not-italic text-ink-muted"
                    >
                      {q}
                    </blockquote>
                  ))}
                </div>
              </div>
            )}

            <AnsweredQuestionsList storyId={storyId} />

            <WhatsNext
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
