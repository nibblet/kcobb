"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function StoriesHubTabs() {
  const pathname = usePathname();
  const onTimeline = pathname === "/stories/timeline";
  const onStories =
    (pathname === "/stories" || pathname.startsWith("/stories/")) &&
    !onTimeline;

  return (
    <div
      className="sticky top-0 z-[40] border-b border-[var(--color-border)] bg-warm-white/95 backdrop-blur-md md:top-[60px]"
      role="tablist"
      aria-label="Stories section"
    >
      <div className="mx-auto flex max-w-content gap-1 px-[var(--page-padding-x)] py-2">
        <Link
          href="/stories"
          role="tab"
          aria-selected={onStories}
          className={`flex-1 rounded-full px-3 py-2 text-center text-xs font-medium transition-colors md:text-sm ${
            onStories
              ? "bg-ink text-warm-white"
              : "bg-transparent text-ink-muted hover:text-ink"
          }`}
        >
          Stories
        </Link>
        <Link
          href="/stories/timeline"
          role="tab"
          aria-selected={onTimeline}
          className={`flex-1 rounded-full px-3 py-2 text-center text-xs font-medium transition-colors md:text-sm ${
            onTimeline
              ? "bg-ink text-warm-white"
              : "bg-transparent text-ink-muted hover:text-ink"
          }`}
        >
          Timeline
        </Link>
      </div>
    </div>
  );
}
