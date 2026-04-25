"use client";

import Link from "next/link";
import { HomeHero } from "@/components/home/HomeHero";
import { Reveal } from "@/components/ui/Reveal";
import { yearToEraAccent, getAllEraAccents } from "@/lib/design/era";
import type { WikiJourney } from "@/lib/wiki/journeys";
import type { CanonicalPrinciple, WikiTimelineEvent } from "@/lib/wiki/parser";

export interface HomePageClientProps {
  yearEvents: readonly WikiTimelineEvent[];
  featuredJourneys: readonly WikiJourney[];
  principles: readonly CanonicalPrinciple[];
}

export function HomePageClient({
  yearEvents,
  featuredJourneys,
  principles,
}: HomePageClientProps) {
  return (
    <div className="pb-16">
      <HomeHero yearEvents={yearEvents} />

      <StartHereRail journeys={featuredJourneys} />
      <PrinciplesPreview principles={principles} />
      <TimelineRibbon events={yearEvents} />
    </div>
  );
}

function StartHereRail({ journeys }: { journeys: readonly WikiJourney[] }) {
  if (journeys.length === 0) return null;

  return (
    <section className="mx-auto max-w-content px-[var(--page-padding-x)] pt-14 md:pt-20">
      <Reveal className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="type-era-label mb-1 text-ink-ghost">Start here</p>
          <h2 className="type-page-title text-balance">
            A few ways into Keith&apos;s story
          </h2>
        </div>
        <Link
          href="/journeys"
          className="type-meta hidden shrink-0 text-clay hover:text-burgundy md:inline"
        >
          All journeys →
        </Link>
      </Reveal>

      <div className="grid gap-4 md:grid-cols-3">
        {journeys.map((journey) => {
          return (
            <Reveal key={journey.slug}>
              <Link
                href={`/journeys/${journey.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-warm-white p-6 transition-[transform,box-shadow,border-color] duration-[var(--duration-slow)] ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:border-clay-border hover:shadow-[0_12px_40px_rgba(44,28,16,0.08)]"
              >
                <h3 className="type-story-title mb-3 transition-colors group-hover:text-burgundy">
                  {journey.title}
                </h3>
                <p className="font-[family-name:var(--font-lora)] text-sm leading-relaxed text-ink-muted line-clamp-3">
                  {journey.narratedDek || journey.description}
                </p>
                <p className="type-meta mt-5 text-ink-ghost">{journey.storyCount} stories</p>
              </Link>
            </Reveal>
          );
        })}
      </div>

      <div className="mt-6 text-center md:hidden">
        <Link href="/journeys" className="type-meta text-clay">
          All journeys →
        </Link>
      </div>
    </section>
  );
}

function PrinciplesPreview({
  principles,
}: {
  principles: readonly CanonicalPrinciple[];
}) {
  if (principles.length === 0) return null;

  return (
    <section className="mx-auto max-w-content px-[var(--page-padding-x)] pt-16 md:pt-24">
      <Reveal className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="type-era-label mb-1 text-ink-ghost">Why it matters</p>
          <h2 className="type-page-title text-balance">
            Principles that show up across a life
          </h2>
        </div>
        <Link
          href="/principles"
          className="type-meta hidden shrink-0 text-clay hover:text-burgundy md:inline"
        >
          All principles →
        </Link>
      </Reveal>

      <div className="grid gap-4 md:grid-cols-3">
        {principles.map((principle) => (
          <Reveal key={principle.id}>
            <Link
              href={`/principles/${principle.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-warm-white p-6 transition-[transform,box-shadow,border-color] duration-[var(--duration-slow)] ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:border-clay-border hover:shadow-[0_12px_40px_rgba(44,28,16,0.08)]"
            >
              <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-burgundy transition-colors group-hover:text-clay">
                {principle.title}
              </h3>
              <p className="mt-3 font-[family-name:var(--font-lora)] text-sm italic leading-relaxed text-ink-muted line-clamp-4">
                &ldquo;{principle.thesis}&rdquo;
              </p>
              <p className="type-meta mt-5 text-ink-ghost">
                {principle.stories.length} supporting{" "}
                {principle.stories.length === 1 ? "story" : "stories"}
              </p>
            </Link>
          </Reveal>
        ))}
      </div>

      <div className="mt-6 text-center md:hidden">
        <Link href="/principles" className="type-meta text-clay">
          All principles →
        </Link>
      </div>
    </section>
  );
}

function TimelineRibbon({
  events,
}: {
  events: readonly WikiTimelineEvent[];
}) {
  if (events.length === 0) return null;

  const decadeMap = new Map<number, number>();
  let minDecade = Infinity;
  let maxDecade = -Infinity;
  for (const evt of events) {
    const decade = Math.floor(evt.year / 10) * 10;
    decadeMap.set(decade, (decadeMap.get(decade) ?? 0) + 1);
    if (decade < minDecade) minDecade = decade;
    if (decade > maxDecade) maxDecade = decade;
  }

  const decades: { decade: number; count: number }[] = [];
  for (let d = minDecade; d <= maxDecade; d += 10) {
    decades.push({ decade: d, count: decadeMap.get(d) ?? 0 });
  }
  const maxCount = Math.max(...decades.map((d) => d.count), 1);

  return (
    <section className="mx-auto max-w-content px-[var(--page-padding-x)] pt-16 md:pt-24">
      <Reveal className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="type-era-label mb-1 text-ink-ghost">The shape of a life</p>
          <h2 className="type-page-title text-balance">
            {events.length} moments across nine decades
          </h2>
        </div>
        <Link
          href="/stories/timeline"
          className="type-meta hidden shrink-0 text-clay hover:text-burgundy md:inline"
        >
          Open timeline →
        </Link>
      </Reveal>

      <Reveal>
        <Link
          href="/stories/timeline"
          className="group block rounded-2xl border border-[var(--color-border)] bg-warm-white p-5 transition-[border-color,box-shadow] duration-[var(--duration-slow)] ease-[var(--ease-out-soft)] hover:border-clay-border hover:shadow-[0_12px_40px_rgba(44,28,16,0.08)]"
        >
          <div className="flex items-end gap-1 sm:gap-2">
            {decades.map(({ decade, count }) => {
              const accent = yearToEraAccent(decade + 5);
              const heightPct = count === 0 ? 6 : 16 + (count / maxCount) * 84;
              return (
                <div
                  key={decade}
                  className="flex flex-1 flex-col items-center gap-1.5"
                >
                  <div className="flex h-20 w-full items-end">
                    <div
                      className={`w-full rounded-t-md ${accent.dot} ${count === 0 ? "opacity-25" : "opacity-80 group-hover:opacity-100"} transition-opacity`}
                      style={{ height: `${heightPct}%` }}
                      aria-hidden
                    />
                  </div>
                  <span className="type-meta text-ink-ghost">
                    {`${decade % 100}s`.padStart(3, "0")}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 hidden flex-wrap gap-3 sm:flex">
            {getAllEraAccents().map((era) => (
              <span
                key={era.key}
                className="type-meta inline-flex items-center gap-1.5 text-ink-ghost"
              >
                <span className={`h-2 w-2 rounded-full ${era.dot}`} aria-hidden />
                {era.label}
              </span>
            ))}
          </div>
        </Link>
      </Reveal>

      <div className="mt-6 text-center md:hidden">
        <Link href="/stories/timeline" className="type-meta text-clay">
          Open timeline →
        </Link>
      </div>
    </section>
  );
}
