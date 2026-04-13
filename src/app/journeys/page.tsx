import Link from "next/link";
import { getAllJourneys } from "@/lib/wiki/journeys";
import { JourneyStatusBadge } from "@/components/journeys/JourneyStatusBadge";

export default function JourneysPage() {
  const journeys = getAllJourneys();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-800 mb-2">
        Guided Journeys
      </h1>
      <p className="text-stone-500 text-sm mb-6">
        A curated path through Keith&apos;s stories
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {journeys.map((journey) => (
          <div key={journey.slug} className="relative">
            <JourneyStatusBadge slug={journey.slug} totalSteps={journey.storyIds.length} />
            <Link
              href={`/journeys/${journey.slug}`}
              className="block bg-white rounded-xl border border-stone-200 p-4 pt-5 hover:border-amber-300 hover:shadow-sm transition-all group h-full"
            >
              <h2 className="text-base font-semibold text-stone-800 group-hover:text-amber-700 transition-colors pr-16">
                {journey.title}
              </h2>
              <p className="text-xs text-stone-500 mt-2 line-clamp-3">
                {journey.description}
              </p>
              <p className="text-xs text-stone-400 mt-3">
                {journey.storyCount} stories
              </p>
              <span className="inline-block mt-3 text-xs font-medium text-amber-700">
                Begin Journey →
              </span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
