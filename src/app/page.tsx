import { HomePageClient } from "@/components/home/HomePageClient";
import { getTimeline } from "@/lib/wiki/parser";

export default function HomePage() {
  const yearEvents = getTimeline();
  return <HomePageClient yearEvents={yearEvents} />;
}
