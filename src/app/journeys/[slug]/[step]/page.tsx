import Link from "next/link";
import { notFound } from "next/navigation";
import { getJourneyBySlug } from "@/lib/wiki/journeys";
import {
  getStoryById,
  getPeopleByStoryId,
  getCanonicalPrinciplesForStory,
} from "@/lib/wiki/parser";
import { addPeopleLinks } from "@/lib/wiki/link-people";
import { lifeStageToEraAccent } from "@/lib/design/era";
import { JourneyProgressBar } from "@/components/journeys/JourneyProgressBar";
import { JourneyConnector } from "@/components/journeys/JourneyConnector";
import { JourneyReflection } from "@/components/journeys/JourneyReflection";
import { JourneyVisitRecorder } from "@/components/journeys/JourneyVisitRecorder";
import { NarrationControls } from "@/components/audio/NarrationControls";
import {
  narrationAudioEndpoint,
  resolveJourneyStepNarration,
} from "@/lib/narration/resolve";
import { PageContextBoundary } from "@/components/layout/PageContextBoundary";
import { StoryMarkdown } from "@/components/story/StoryMarkdown";
import { PrinciplesInlineProse } from "@/components/principles/PrinciplesInlineProse";

export default async function JourneyStepPage({
  params,
}: {
  params: Promise<{ slug: string; step: string }>;
}) {
  const { slug, step: stepStr } = await params;
  const journey = getJourneyBySlug(slug);
  if (!journey) notFound();

  const step = parseInt(stepStr, 10);
  if (!Number.isFinite(step) || step < 1 || step > journey.storyIds.length) {
    notFound();
  }

  const storyId = journey.storyIds[step - 1];
  const story = getStoryById(storyId);
  if (!story) notFound();

  const principlesForStory = getCanonicalPrinciplesForStory(storyId);
  const peopleInStory = getPeopleByStoryId(storyId);
  const linkedFullText = addPeopleLinks(story.fullText, peopleInStory);

  const reflection =
    journey.reflections[storyId] ||
    "What part of this story stays with you, and why?";

  const prevStep = step > 1 ? step - 1 : null;
  const nextStep = step < journey.storyIds.length ? step + 1 : null;
  const era = lifeStageToEraAccent(story.lifeStage);

  const stepNarration = resolveJourneyStepNarration(slug, step);

  return (
    <div className="mx-auto max-w-story px-[var(--page-padding-x)] py-6 pb-24 md:pb-10">
      <PageContextBoundary
        type="journey"
        slug={journey.slug}
        title={journey.title}
      />
      <JourneyVisitRecorder slug={journey.slug} step={step} />

      <Link
        href={`/journeys/${journey.slug}`}
        className="type-ui mb-4 inline-block text-ink-ghost no-underline transition-colors hover:text-ocean"
      >
        &larr; {journey.title}
      </Link>

      <JourneyProgressBar
        step={step}
        total={journey.storyIds.length}
        journeyTitle={journey.title}
      />

      <h1 className="type-story-title mb-2">{story.title}</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${era.badgeClass}`}
        >
          {story.lifeStage}
        </span>
      </div>

      <div className="mb-3 rounded-lg border border-clay-border bg-gold-pale/40 p-4">
        <p className="font-[family-name:var(--font-lora)] text-sm italic leading-relaxed text-ink">
          {story.summary}
        </p>
      </div>

      <PrinciplesInlineProse
        principles={principlesForStory}
        prefix="Principles in this story include"
      />

      {stepNarration && (
        <NarrationControls
          playbackKey={stepNarration.contentHash}
          title={story.title}
          fullText={stepNarration.speechBodyPlain}
          wordCount={stepNarration.wordCount}
          audioEndpoint={narrationAudioEndpoint(stepNarration)}
        />
      )}

      <article className="story-body prose prose-story prose-lg mb-8 max-w-none">
        <StoryMarkdown content={linkedFullText} />
      </article>

      <JourneyReflection prompt={reflection} />

      {nextStep !== null &&
        (() => {
          const nextStoryId = journey.storyIds[step];
          const connectorKey = `${storyId}→${nextStoryId}`;
          const connectorText = journey.connectors[connectorKey];
          return connectorText ? (
            <JourneyConnector text={connectorText} />
          ) : null;
        })()}

      <div className="flex flex-col gap-3 border-t border-[var(--color-divider)] pt-4 sm:flex-row">
        {prevStep !== null ? (
          <Link
            href={`/journeys/${journey.slug}/${prevStep}`}
            className="type-ui flex-1 rounded-lg border border-[var(--color-border)] bg-warm-white py-2.5 text-center font-medium text-ink transition-colors hover:border-clay-border"
          >
            ← Previous Story
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {nextStep !== null ? (
          <Link
            href={`/journeys/${journey.slug}/${nextStep}`}
            className="type-ui flex-1 rounded-lg bg-clay py-2.5 text-center font-medium text-warm-white transition-colors hover:bg-clay-mid"
          >
            Next Story →
          </Link>
        ) : (
          <Link
            href={`/journeys/${journey.slug}/complete`}
            className="type-ui flex-1 rounded-lg bg-clay py-2.5 text-center font-medium text-warm-white transition-colors hover:bg-clay-mid"
          >
            Finish Journey
          </Link>
        )}
      </div>
    </div>
  );
}
