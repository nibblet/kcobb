import Link from "next/link";
import { notFound } from "next/navigation";
import { getJourneyBySlug, getJourneySlugs } from "@/lib/wiki/journeys";
import { getStoryById } from "@/lib/wiki/parser";
import { JourneyCompleteMarker } from "@/components/journeys/JourneyCompleteMarker";
import { JourneyCompleteSummary } from "@/components/journeys/JourneyCompleteSummary";

export function generateStaticParams() {
  return getJourneySlugs().map((slug) => ({ slug }));
}

function uniquePrinciplesForJourney(storyIds: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of storyIds) {
    const s = getStoryById(id);
    if (!s) continue;
    for (const p of s.principles) {
      const key = p.trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        out.push(p.trim());
      }
    }
  }
  return out;
}

export default async function JourneyCompletePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const journey = getJourneyBySlug(slug);
  if (!journey) notFound();

  const principles = uniquePrinciplesForJourney(journey.storyIds);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
      <JourneyCompleteMarker slug={journey.slug} />

      <Link
        href="/journeys"
        className="text-sm text-stone-400 hover:text-stone-600 transition-colors mb-4 inline-block"
      >
        &larr; All Journeys
      </Link>

      <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-800 mb-2">
        You&apos;ve completed
      </h1>
      <p className="text-xl font-serif text-amber-800 mb-6">{journey.title}</p>

      <JourneyCompleteSummary
        journeyTitle={journey.title}
        principles={
          principles.length > 0
            ? principles
            : [
                "Carry forward the lessons that spoke to you — you can revisit any story anytime.",
              ]
        }
      />

      <div className="flex flex-col gap-3">
        <Link
          href={`/ask?journey=${encodeURIComponent(journey.slug)}`}
          className="text-center py-2.5 bg-amber-700 text-white text-sm font-medium rounded-lg hover:bg-amber-800 transition-colors"
        >
          Ask Keith about this journey
        </Link>
        <Link
          href="/journeys"
          className="text-center py-2.5 bg-white border border-stone-200 text-stone-700 text-sm font-medium rounded-lg hover:border-amber-300 transition-colors"
        >
          Explore another journey
        </Link>
        <Link
          href="/stories"
          className="text-center py-2.5 bg-stone-100 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-200 transition-colors"
        >
          Browse all stories
        </Link>
      </div>
    </div>
  );
}
