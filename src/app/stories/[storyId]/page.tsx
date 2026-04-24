import { getStoryById, getPeopleByStoryId } from "@/lib/wiki/parser";
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
  if (story.principles.length > 0)
    tocSections.push({ id: "shows", label: "What This Story Shows" });
  if (story.heuristics.length > 0)
    tocSections.push({ id: "thinking-about", label: "If You're Thinking About" });
  if (story.quotes.length > 0)
    tocSections.push({ id: "quotes", label: "Key Quotes" });
  if (story.relatedStoryIds.length > 0)
    tocSections.push({ id: "related", label: "Related Stories" });
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
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
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
                  fullText={linkedFullText}
                />
              ) : (
                <article className="story-body prose prose-story prose-lg max-w-none pb-8">
                  <StoryMarkdown content={linkedFullText} />
                </article>
              )}
            </div>

            {story.principles.length > 0 && (
              <div
                id="shows"
                className="mb-4 scroll-mt-20 rounded-xl border border-[var(--color-border)] bg-warm-white p-5"
              >
                <h2 className="type-meta mb-3 text-ink">
                  What This Story Shows
                </h2>
                <ul className="space-y-2">
                  {story.principles.map((p, i) => (
                    <li
                      key={i}
                      className="flex gap-2 font-[family-name:var(--font-lora)] text-sm text-ink-muted"
                    >
                      <span className="mt-0.5 text-clay">&#9679;</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {story.heuristics.length > 0 && (
              <div
                id="thinking-about"
                className="mb-4 scroll-mt-20 rounded-xl border border-[var(--color-border)] bg-warm-white p-5"
              >
                <h2 className="type-meta mb-3 text-ink">
                  If You&apos;re Thinking About...
                </h2>
                <ul className="space-y-2">
                  {story.heuristics.map((h, i) => (
                    <li
                      key={i}
                      className="flex gap-2 font-[family-name:var(--font-lora)] text-sm text-ink-muted"
                    >
                      <span className="mt-0.5 text-clay">&#9679;</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {story.quotes.length > 0 && (
              <div id="quotes" className="mb-6 scroll-mt-20">
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

            {story.relatedStoryIds.length > 0 && (
              <div id="related" className="mb-6 scroll-mt-20">
                <h2 className="type-meta mb-3 text-ink">Related Stories</h2>
                <div className="space-y-2">
                  {relatedStories.map(({ relId, story: rel }) => {
                    if (!rel) return null;
                    return (
                      <Link
                        key={relId}
                        href={`/stories/${relId}`}
                        className="block rounded-lg border border-[var(--color-border)] bg-warm-white p-3 transition-colors hover:border-clay-border"
                      >
                        <span className="type-ui block text-ink">
                          {rel.title}
                        </span>
                        <span className="mt-0.5 line-clamp-1 font-[family-name:var(--font-lora)] text-xs text-ink-muted">
                          {rel.summary}
                        </span>
                      </Link>
                    );
                  })}
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
                firstPrincipleSlug: story.principles[0] ?? null,
                firstPrincipleTitle: story.principles[0]
                  ? story.principles[0].replace(/-/g, " ")
                  : null,
              })}
            />
          </div>

          <StoryTOC sections={tocSections} />
        </div>
      </div>
    </>
  );
}
