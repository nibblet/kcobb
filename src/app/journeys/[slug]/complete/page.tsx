import Link from "next/link";
import { notFound } from "next/navigation";
import { getJourneyBySlug } from "@/lib/wiki/journeys";
import { getStoryById } from "@/lib/wiki/parser";
import { JourneyCompleteMarker } from "@/components/journeys/JourneyCompleteMarker";
import { JourneyCompleteSummary } from "@/components/journeys/JourneyCompleteSummary";
import { PageContextBoundary } from "@/components/layout/PageContextBoundary";
import { WhatsNext } from "@/components/nav/WhatsNext";
import { getJourneyCompleteWhatsNext } from "@/lib/navigation/whats-next";

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
    <div className="mx-auto max-w-content px-[var(--page-padding-x)] py-6 md:py-10">
      <PageContextBoundary
        type="journey"
        slug={journey.slug}
        title={journey.title}
      />
      <JourneyCompleteMarker slug={journey.slug} />

      <Link
        href="/journeys"
        className="type-ui mb-4 inline-block text-ink-ghost no-underline transition-colors hover:text-ocean"
      >
        &larr; All Journeys
      </Link>

      <h1 className="type-page-title mb-2">You&apos;ve completed</h1>
      <p className="type-story-title mb-6 text-clay">{journey.title}</p>

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

      <WhatsNext
        data={getJourneyCompleteWhatsNext({
          slug: journey.slug,
          title: journey.title,
        })}
      />
    </div>
  );
}
