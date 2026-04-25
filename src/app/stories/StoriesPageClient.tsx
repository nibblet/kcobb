"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { StoryCard } from "@/lib/wiki/static-data";
import { Reveal } from "@/components/ui/Reveal";
import { getAllEraAccents, lifeStageToEraAccent } from "@/lib/design/era";
import { ReadBadgeAgeAware } from "@/components/story/ReadBadgeAgeAware";

const IV_PLACEMENT: Record<string, string> = {
  IV_S01: "P1_S39",
  IV_S02: "P1_S02",
  IV_S03: "P1_S24",
  IV_S04: "P1_S25",
  IV_S05: "P1_S25",
  IV_S06: "P1_S38",
  IV_S07: "P1_S26",
  IV_S08: "P1_S17",
  IV_S09: "P1_S35",
  IV_S10: "P1_S39",
};

function interleaveSort(stories: StoryCard[]): StoryCard[] {
  const memoirOrder = new Map<string, number>();
  stories
    .filter((s) => s.source === "memoir")
    .sort((a, b) => a.storyId.localeCompare(b.storyId))
    .forEach((s, i) => memoirOrder.set(s.storyId, (i + 1) * 100));

  const sortKey = new Map<string, number>();
  for (const story of stories) {
    if (story.source === "memoir") {
      sortKey.set(story.storyId, memoirOrder.get(story.storyId) || 0);
    } else if (story.storyId in IV_PLACEMENT) {
      const anchorOrder = memoirOrder.get(IV_PLACEMENT[story.storyId]) || 9999;
      const ivNum = parseInt(story.storyId.replace("IV_S", "")) || 0;
      sortKey.set(story.storyId, anchorOrder + ivNum);
    } else {
      sortKey.set(story.storyId, 50000);
    }
  }

  return [...stories].sort(
    (a, b) => (sortKey.get(a.storyId) || 0) - (sortKey.get(b.storyId) || 0)
  );
}

export function StoriesPageClient({
  stories,
  readStoryIds,
}: {
  stories: StoryCard[];
  readStoryIds: string[];
}) {
  const [search, setSearch] = useState("");

  const readSet = useMemo(() => new Set(readStoryIds), [readStoryIds]);

  const sorted = useMemo(() => interleaveSort(stories), [stories]);
  const eras = useMemo(() => getAllEraAccents(), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (story) =>
        story.title.toLowerCase().includes(q) ||
        story.summary.toLowerCase().includes(q),
    );
  }, [sorted, search]);

  const groupedByEra = useMemo(() => {
    const groups = new Map<string, StoryCard[]>();
    for (const story of filtered) {
      const era = lifeStageToEraAccent(story.lifeStage);
      const arr = groups.get(era.key) ?? [];
      arr.push(story);
      groups.set(era.key, arr);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="mx-auto max-w-content px-[var(--page-padding-x)] py-6 md:py-10">
      <h1 className="type-page-title mb-2">Story Library</h1>
      <p className="type-ui mb-6 text-ink-muted">
        Stories from Keith&apos;s memoir, interviews, and family reflections.
      </p>

      <div className="relative mb-8">
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-ghost"
        >
          &#128269;
        </span>
        <input
          type="search"
          placeholder="Search stories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="type-ui w-full rounded-lg border border-[var(--color-border)] bg-warm-white py-2 pl-10 pr-10 text-ink placeholder:text-ink-ghost focus:border-clay-mid focus:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-ink-ghost transition-colors hover:bg-paper hover:text-ink"
          >
            &times;
          </button>
        )}
      </div>

      <div>
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-ghost">
            No stories match your search.
          </p>
        ) : (
          eras.map((era) => {
            const storiesInEra = groupedByEra.get(era.key) ?? [];
            if (storiesInEra.length === 0) return null;
            return (
              <section key={era.key} className="mb-8">
                <p className="type-era-label mb-3 text-ink-ghost">{era.label}</p>
                <div>
                  {storiesInEra.map((story) => {
                    const storyEra = lifeStageToEraAccent(story.lifeStage);
                    return (
                      <Reveal key={story.storyId}>
                        <Link
                          href={`/stories/${story.storyId}`}
                          className={`group block border-b border-[var(--color-divider)] py-5 pl-4 ${storyEra.accentBorder} border-l-4`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h2 className="font-[family-name:var(--font-playfair)] text-base font-semibold text-ink transition-colors group-hover:text-burgundy">
                                {story.title}
                              </h2>
                              <p className="mt-1 line-clamp-2 font-[family-name:var(--font-lora)] text-sm leading-relaxed text-ink-muted">
                                {story.summary}
                              </p>
                            </div>
                            {readSet.has(story.storyId) && <ReadBadgeAgeAware />}
                          </div>
                        </Link>
                      </Reveal>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>
      <p className="type-meta text-ink-ghost">{stories.length} stories total</p>
    </div>
  );
}
