import Link from "next/link";
import { getAllJourneys } from "@/lib/wiki/journeys";
import { JourneyStatusBadge } from "@/components/journeys/JourneyStatusBadge";

export default function JourneysPage() {
  const journeys = getAllJourneys();

  return (
    <div className="mx-auto max-w-content px-[var(--page-padding-x)] py-6 md:py-10">
      <h1 className="type-page-title mb-2">Guided Journeys</h1>
      <p className="type-ui mb-6 text-ink-muted">
        A curated path through Keith&apos;s stories
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {journeys.map((journey) => (
          <div key={journey.slug} className="relative">
            <JourneyStatusBadge
              slug={journey.slug}
              totalSteps={journey.storyIds.length}
            />
            <Link
              href={`/journeys/${journey.slug}`}
              className="group block h-full rounded-xl border border-[var(--color-border)] bg-warm-white p-4 pb-5 pt-5 pr-16 transition-[border-color,box-shadow] hover:border-clay-border hover:shadow-[0_8px_24px_rgba(44,28,16,0.06)]"
            >
              <h2 className="font-[family-name:var(--font-playfair)] text-base font-semibold text-ink transition-colors group-hover:text-burgundy">
                {journey.title}
              </h2>
              <p className="type-ui mt-2 line-clamp-3 text-ink-muted">
                {journey.description}
              </p>
              <p className="type-meta mt-3 normal-case tracking-normal text-ink-ghost">
                {journey.storyCount} stories
              </p>
              <span className="type-ui mt-3 inline-block font-medium text-ocean">
                Begin Journey →
              </span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
