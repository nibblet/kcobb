import Link from "next/link";
import { notFound } from "next/navigation";
import { getJourneyBySlug, getJourneySlugs } from "@/lib/wiki/journeys";
import { getStoryById } from "@/lib/wiki/parser";
import { JourneyIntroContinue } from "@/components/journeys/JourneyIntroContinue";

export function generateStaticParams() {
  return getJourneySlugs().map((slug) => ({ slug }));
}

export default async function JourneyIntroPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const journey = getJourneyBySlug(slug);

  if (!journey) notFound();

  const titles = journey.storyIds.map((id) => {
    const s = getStoryById(id);
    return { id, title: s?.title || id };
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
      <Link
        href="/journeys"
        className="text-sm text-stone-400 hover:text-stone-600 transition-colors mb-4 inline-block"
      >
        &larr; All Journeys
      </Link>

      <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-800 mb-3">
        {journey.title}
      </h1>
      <p className="text-stone-600 text-sm leading-relaxed mb-6">
        {journey.description}
      </p>

      <JourneyIntroContinue slug={journey.slug} totalSteps={journey.storyIds.length} />

      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-stone-800 uppercase tracking-wide mb-3">
          Stories in this journey
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-stone-700">
          {titles.map(({ id, title }) => (
            <li key={id}>
              <span className="text-stone-800">{title}</span>
            </li>
          ))}
        </ol>
      </div>

      <Link
        href={`/journeys/${journey.slug}/1`}
        className="inline-block w-full sm:w-auto text-center py-3 px-6 bg-amber-700 text-white text-sm font-medium rounded-lg hover:bg-amber-800 transition-colors"
      >
        Start Journey
      </Link>
    </div>
  );
}
