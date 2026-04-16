"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAgeMode } from "@/hooks/useAgeMode";

export function ExploreHubTabs() {
  const pathname = usePathname();
  const { ageMode } = useAgeMode();
  const onJourneys = pathname.startsWith("/journeys");
  const onThemes = pathname.startsWith("/themes");
  const hideThemes = ageMode === "young_reader";

  if (hideThemes) {
    return (
      <div
        className="sticky top-0 z-[40] border-b border-[var(--color-border)] bg-warm-white/95 backdrop-blur-md md:top-[60px]"
        role="tablist"
        aria-label="Explore section"
      >
        <div className="mx-auto flex max-w-content px-[var(--page-padding-x)] py-2">
          <span
            role="tab"
            aria-selected
            className="w-full rounded-full bg-ink px-3 py-2 text-center text-xs font-medium text-warm-white md:text-sm"
          >
            Journeys
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="sticky top-0 z-[40] border-b border-[var(--color-border)] bg-warm-white/95 backdrop-blur-md md:top-[60px]"
      role="tablist"
      aria-label="Explore section"
    >
      <div className="mx-auto flex max-w-content gap-1 px-[var(--page-padding-x)] py-2">
        <Link
          href="/journeys"
          role="tab"
          aria-selected={onJourneys}
          className={`flex-1 rounded-full px-3 py-2 text-center text-xs font-medium transition-colors md:text-sm ${
            onJourneys
              ? "bg-ink text-warm-white"
              : "bg-transparent text-ink-muted hover:text-ink"
          }`}
        >
          Journeys
        </Link>
        <Link
          href="/themes"
          role="tab"
          aria-selected={onThemes}
          className={`flex-1 rounded-full px-3 py-2 text-center text-xs font-medium transition-colors md:text-sm ${
            onThemes
              ? "bg-ink text-warm-white"
              : "bg-transparent text-ink-muted hover:text-ink"
          }`}
        >
          Themes
        </Link>
      </div>
    </div>
  );
}
