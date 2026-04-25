import Link from "next/link";
import { notFound } from "next/navigation";
import { getJourneyBySlug } from "@/lib/wiki/journeys";
import {
  getPeopleByStoryId,
  getCanonicalPrinciplesForStoryIds,
  getStoryTimelinePoints,
} from "@/lib/wiki/parser";
import { addPeopleLinks } from "@/lib/wiki/link-people";
import { JourneyExperienceBadge } from "@/components/journeys/JourneyExperienceBadge";
import { JourneyNarratedSources } from "@/components/journeys/JourneyNarratedSources";
import { NarrationControls } from "@/components/audio/NarrationControls";
import { StoryMarkdown } from "@/components/story/StoryMarkdown";
import { StoryTimelineStrip } from "@/components/story/StoryTimelineStrip";
import { PrinciplesInlineProse } from "@/components/principles/PrinciplesInlineProse";
import { PageContextBoundary } from "@/components/layout/PageContextBoundary";
import { WhatsNext } from "@/components/nav/WhatsNext";
import { getJourneyCompleteWhatsNext } from "@/lib/navigation/whats-next";
import {
  narrationAudioEndpoint,
  resolveJourneyNarratedNarration,
} from "@/lib/narration/resolve";

export default async function NarratedJourneyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const journey = getJourneyBySlug(slug);

  if (!journey || journey.narratedSections.length === 0) notFound();

  const narratedListen = resolveJourneyNarratedNarration(slug);

  const principlesForJourney = getCanonicalPrinciplesForStoryIds(
    journey.storyIds,
  );
  const timelinePoints = getStoryTimelinePoints();

  return (
    <div className="mx-auto max-w-story px-[var(--page-padding-x)] py-6 md:py-10">
      <PageContextBoundary
        type="journey"
        slug={journey.slug}
        title={journey.title}
      />
      <Link
        href="/journeys"
        className="type-ui mb-4 inline-block text-ink-ghost no-underline transition-colors hover:text-ocean"
      >
        &larr; All Journeys
      </Link>

      <div className="mb-3 flex flex-wrap gap-2">
        <JourneyExperienceBadge mode="narrated" />
      </div>

      <h1 className="type-page-title mb-3">{journey.title}</h1>
      <p className="type-body mb-3 text-pretty text-ink-muted">
        {journey.narratedDek || journey.description}
      </p>

      <PrinciplesInlineProse
        principles={principlesForJourney}
        prefix="Principles this journey explores include"
      />

      <StoryTimelineStrip
        points={timelinePoints}
        highlightedStoryIds={journey.storyIds}
        ariaLabel="Stories in this journey on Keith's life timeline"
      />

      {narratedListen && (
        <NarrationControls
          playbackKey={narratedListen.contentHash}
          title={journey.title}
          fullText={narratedListen.speechBodyPlain}
          wordCount={narratedListen.wordCount}
          audioEndpoint={narrationAudioEndpoint(narratedListen)}
        />
      )}

      <div className="space-y-8">
        {journey.narratedSections.map((section) => {
          const sectionPeople = Array.from(
            new Map(
              section.sourceStoryIds
                .flatMap((id) => getPeopleByStoryId(id))
                .map((p) => [p.slug, p]),
            ).values(),
          );
          const linkedBody = addPeopleLinks(section.body, sectionPeople);
          return (
            <section key={section.title} className="space-y-4">
              <div>
                <h2 className="type-story-title mb-3 text-clay">{section.title}</h2>
                <article className="story-body prose prose-story prose-lg max-w-none">
                  <StoryMarkdown content={linkedBody} />
                </article>
              </div>
              <JourneyNarratedSources sourceStoryIds={section.sourceStoryIds} />
            </section>
          );
        })}
      </div>

      <WhatsNext
        floating
        data={getJourneyCompleteWhatsNext({
          slug: journey.slug,
          title: journey.title,
          firstPrincipleSlug: principlesForJourney[0]?.slug ?? null,
          firstPrincipleTitle: principlesForJourney[0]?.shortTitle ?? null,
        })}
      />
    </div>
  );
}
