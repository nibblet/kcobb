import Link from "next/link";
import { notFound } from "next/navigation";
import { getJourneyBySlug } from "@/lib/wiki/journeys";
import {
  getStoryById,
  getCanonicalPrinciplesForStory,
} from "@/lib/wiki/parser";
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

function canonicalPrinciplesForJourney(
  storyIds: string[],
): { slug: string; shortTitle: string }[] {
  const seen = new Set<string>();
  const out: { slug: string; shortTitle: string }[] = [];
  for (const id of storyIds) {
    for (const p of getCanonicalPrinciplesForStory(id)) {
      if (!seen.has(p.slug)) {
        seen.add(p.slug);
        out.push({ slug: p.slug, shortTitle: p.shortTitle });
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
  const canonicalPrinciples = canonicalPrinciplesForJourney(journey.storyIds);

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

      {canonicalPrinciples.length > 0 && (
        <div className="mb-8 rounded-xl border border-[var(--color-border)] bg-warm-white p-5">
          <h2 className="type-meta mb-3 text-ink">
            Principles this journey surfaced
          </h2>
          <div className="flex flex-wrap gap-2">
            {canonicalPrinciples.map((p) => (
              <Link
                key={p.slug}
                href={`/principles/${p.slug}`}
                className="type-ui rounded-full border border-[var(--color-border)] bg-warm-white-2 px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-clay-border hover:text-clay"
              >
                {p.shortTitle}
              </Link>
            ))}
          </div>
        </div>
      )}

      <WhatsNext
        data={getJourneyCompleteWhatsNext({
          slug: journey.slug,
          title: journey.title,
        })}
      />
    </div>
  );
}
