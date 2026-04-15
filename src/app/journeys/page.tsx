import Link from "next/link";
import { getAllJourneys } from "@/lib/wiki/journeys";
import { JourneyStatusBadge } from "@/components/journeys/JourneyStatusBadge";
import { JourneyExperienceBadge } from "@/components/journeys/JourneyExperienceBadge";

export default function JourneysPage() {
  const journeys = getAllJourneys();

  return (
    <div className="mx-auto max-w-content px-[var(--page-padding-x)] py-6 md:py-10">
      <h1 className="type-page-title mb-2">Journeys</h1>
      <p className="type-ui mb-6 text-ink-muted">
        Explore Keith&apos;s life as either a curated path through stories or a newly narrated journey woven from the memoir and interviews.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {journeys.map((journey) => (
          <div
            key={journey.slug}
            className="relative rounded-xl border border-[var(--color-border)] bg-warm-white p-4 pb-5 pt-5 pr-16"
          >
            <JourneyStatusBadge
              slug={journey.slug}
              totalSteps={journey.storyIds.length}
            />
            <div className="mb-3 flex flex-wrap gap-2">
              {journey.experienceModes.map((mode) => (
                <JourneyExperienceBadge key={mode} mode={mode} />
              ))}
            </div>
            <div className="group">
              <h2 className="font-[family-name:var(--font-playfair)] text-base font-semibold text-ink transition-colors group-hover:text-burgundy">
                {journey.title}
              </h2>
              <p className="type-ui mt-2 line-clamp-3 text-ink-muted">
                {journey.description}
              </p>
              <p className="type-meta mt-3 normal-case tracking-normal text-ink-ghost">
                {journey.storyCount} stories
              </p>
              {journey.narratedDek && (
                <p className="mt-3 font-[family-name:var(--font-lora)] text-xs italic text-ink-muted">
                  {journey.narratedDek}
                </p>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {journey.experienceModes.includes("narrated") && (
                <Link
                  href={`/journeys/${journey.slug}/narrated`}
                  className="type-ui rounded-lg bg-clay px-4 py-2.5 text-center font-medium text-warm-white transition-colors hover:bg-clay-mid"
                >
                  Read Narrated Journey
                </Link>
              )}
              <Link
                href={`/journeys/${journey.slug}`}
                className="type-ui rounded-lg border border-[var(--color-border)] bg-warm-white-2 px-4 py-2.5 text-center font-medium text-ink transition-colors hover:border-clay-border"
              >
                Open Guided Journey
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
