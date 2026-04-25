import Link from "next/link";
import { getAllJourneys } from "@/lib/wiki/journeys";
import { JourneyStatusBadge } from "@/components/journeys/JourneyStatusBadge";
import { lifeStageToEraAccent } from "@/lib/design/era";
import { getStoryById } from "@/lib/wiki/parser";

export default function JourneysPage() {
  const journeys = getAllJourneys();

  return (
    <div className="mx-auto max-w-content px-[var(--page-padding-x)] py-6 md:py-10">
      <h1 className="type-page-title mb-2">Journeys</h1>
      <p className="type-ui mb-6 text-ink-muted">
        Curated paths through Keith&apos;s life — each woven from the memoir and
        interviews into a single narrative arc.
      </p>

      <div className="space-y-3">
        {journeys.map((journey) => {
          const hasNarrated = journey.experienceModes.includes("narrated");
          const href = hasNarrated
            ? `/journeys/${journey.slug}/narrated`
            : `/journeys/${journey.slug}`;

          return (
            <Link
              key={journey.slug}
              href={href}
              className={`group relative block border-b border-[var(--color-divider)] py-5 pl-4 pr-16 ${
                lifeStageToEraAccent(
                  getStoryById(journey.storyIds[0])?.lifeStage ?? "",
                ).accentBorder
              } border-l-4`}
            >
              <JourneyStatusBadge
                slug={journey.slug}
                totalSteps={journey.storyIds.length}
              />
              <h2 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-ink transition-colors group-hover:text-burgundy">
                {journey.title}
              </h2>
              <p className="mt-1.5 line-clamp-3 font-[family-name:var(--font-lora)] text-sm leading-relaxed text-ink-muted">
                {journey.description}
              </p>
              <p className="type-meta mt-3 normal-case tracking-normal text-ink-ghost">
                {journey.storyCount} stories
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
