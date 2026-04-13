import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getAllJourneys, getJourneyBySlug } from "@/lib/wiki/journeys";
import { getStoryById } from "@/lib/wiki/parser";
import { JourneyProgressBar } from "@/components/journeys/JourneyProgressBar";
import { JourneyReflection } from "@/components/journeys/JourneyReflection";
import { JourneyVisitRecorder } from "@/components/journeys/JourneyVisitRecorder";

export function generateStaticParams() {
  const journeys = getAllJourneys();
  return journeys.flatMap((j) =>
    j.storyIds.map((_, i) => ({
      slug: j.slug,
      step: String(i + 1),
    }))
  );
}

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

  const reflection =
    journey.reflections[storyId] ||
    "What part of this story stays with you, and why?";

  const prevStep = step > 1 ? step - 1 : null;
  const nextStep = step < journey.storyIds.length ? step + 1 : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 pb-24 md:pb-10">
      <JourneyVisitRecorder slug={journey.slug} step={step} />

      <Link
        href={`/journeys/${journey.slug}`}
        className="text-sm text-stone-400 hover:text-stone-600 transition-colors mb-4 inline-block"
      >
        &larr; {journey.title}
      </Link>

      <JourneyProgressBar
        step={step}
        total={journey.storyIds.length}
        journeyTitle={journey.title}
      />

      <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-800 mb-2">
        {story.title}
      </h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-2.5 py-0.5 text-xs font-medium bg-stone-100 text-stone-600 rounded-full">
          {story.lifeStage}
        </span>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-stone-700 italic">{story.summary}</p>
      </div>

      <article className="prose prose-stone prose-sm md:prose-base max-w-none mb-8 leading-relaxed">
        <ReactMarkdown>{story.fullText}</ReactMarkdown>
      </article>

      {story.principles.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-stone-800 uppercase tracking-wide mb-3">
            What This Story Shows
          </h2>
          <ul className="space-y-2">
            {story.principles.map((p, i) => (
              <li key={i} className="text-sm text-stone-600 flex gap-2">
                <span className="text-amber-600 mt-0.5">&#9679;</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      <JourneyReflection prompt={reflection} />

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-200">
        {prevStep !== null ? (
          <Link
            href={`/journeys/${journey.slug}/${prevStep}`}
            className="flex-1 text-center py-2.5 bg-stone-100 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-200 transition-colors"
          >
            ← Previous Story
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {nextStep !== null ? (
          <Link
            href={`/journeys/${journey.slug}/${nextStep}`}
            className="flex-1 text-center py-2.5 bg-amber-700 text-white text-sm font-medium rounded-lg hover:bg-amber-800 transition-colors"
          >
            Next Story →
          </Link>
        ) : (
          <Link
            href={`/journeys/${journey.slug}/complete`}
            className="flex-1 text-center py-2.5 bg-amber-700 text-white text-sm font-medium rounded-lg hover:bg-amber-800 transition-colors"
          >
            Finish Journey
          </Link>
        )}
      </div>
    </div>
  );
}
