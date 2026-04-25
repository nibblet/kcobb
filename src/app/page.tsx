import { HomePageClient } from "@/components/home/HomePageClient";
import { getAllJourneys } from "@/lib/wiki/journeys";
import { getAllCanonicalPrinciples, getTimeline } from "@/lib/wiki/parser";

const FEATURED_JOURNEY_SLUGS = [
  "roots-and-values",
  "the-making-of-a-career",
  "leadership-under-pressure",
] as const;

export default function HomePage() {
  const yearEvents = getTimeline();
  const allJourneys = getAllJourneys();
  const featuredJourneys = FEATURED_JOURNEY_SLUGS
    .map((slug) => allJourneys.find((j) => j.slug === slug))
    .filter((j): j is NonNullable<typeof j> => Boolean(j));

  const principles = getAllCanonicalPrinciples().slice(0, 3);

  return (
    <HomePageClient
      yearEvents={yearEvents}
      featuredJourneys={featuredJourneys}
      principles={principles}
    />
  );
}
