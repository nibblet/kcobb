"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { storiesData } from "@/lib/wiki/static-data";
import { Reveal } from "@/components/ui/Reveal";
import { lifeStageToEraAccent } from "@/lib/design/era";

const LIFE_STAGES = [
  "All",
  "Childhood",
  "Education",
  "Early Career",
  "Mid Career",
  "Leadership",
  "Reflection",
  "Legacy",
];

export default function StoriesPage() {
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState("All");
  const [selectedTheme, setSelectedTheme] = useState("All");

  const allThemes = useMemo(() => {
    const themes = new Set<string>();
    storiesData.forEach((s) => s.themes.forEach((t) => themes.add(t)));
    return ["All", ...Array.from(themes).sort()];
  }, []);

  const filtered = useMemo(() => {
    return storiesData.filter((story) => {
      const matchesSearch =
        !search ||
        story.title.toLowerCase().includes(search.toLowerCase()) ||
        story.summary.toLowerCase().includes(search.toLowerCase());
      const matchesStage =
        selectedStage === "All" || story.lifeStage === selectedStage;
      const matchesTheme =
        selectedTheme === "All" || story.themes.includes(selectedTheme);
      return matchesSearch && matchesStage && matchesTheme;
    });
  }, [search, selectedStage, selectedTheme]);

  return (
    <div className="mx-auto max-w-content px-[var(--page-padding-x)] py-6 md:py-10">
      <h1 className="type-page-title mb-2">Story Library</h1>
      <p className="type-ui mb-6 text-ink-muted">
        {`${storiesData.length} stories from Keith Cobb's life`}
      </p>

      <div className="mb-6 space-y-3">
        <input
          type="search"
          placeholder="Search stories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="type-ui w-full rounded-lg border border-[var(--color-border)] bg-warm-white px-3 py-2 text-ink placeholder:text-ink-ghost"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {LIFE_STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => setSelectedStage(stage)}
              className={`type-meta shrink-0 rounded-full px-3 py-1 transition-colors ${
                selectedStage === stage
                  ? "bg-clay text-warm-white"
                  : "bg-warm-white text-ink-muted ring-1 ring-[var(--color-border)] hover:text-ink"
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allThemes.map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => setSelectedTheme(theme)}
              className={`type-meta shrink-0 rounded-full px-3 py-1 transition-colors ${
                selectedTheme === theme
                  ? "bg-burgundy text-warm-white"
                  : "bg-warm-white text-ink-muted ring-1 ring-[var(--color-border)] hover:text-ink"
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-ghost">
            No stories match your filters.
          </p>
        )}
        {filtered.map((story) => {
          const era = lifeStageToEraAccent(story.lifeStage);
          return (
            <Reveal key={story.storyId}>
              <Link
                href={`/stories/${story.storyId}`}
                className="group block rounded-xl border border-[var(--color-border)] bg-warm-white p-4 transition-[transform,box-shadow,border-color] duration-[var(--duration-slow)] ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:border-clay-border hover:shadow-[0_12px_40px_rgba(44,28,16,0.08)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-[family-name:var(--font-playfair)] text-base font-semibold text-ink transition-colors group-hover:text-burgundy">
                      {story.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 font-[family-name:var(--font-lora)] text-sm leading-relaxed text-ink-muted">
                      {story.summary}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${era.badgeClass}`}
                      >
                        {story.lifeStage}
                      </span>
                      {story.themes.slice(0, 3).map((theme) => {
                        const isLeadership = theme
                          .toLowerCase()
                          .includes("leadership");
                        return (
                          <span
                            key={theme}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              isLeadership
                                ? "bg-ocean-pale text-ocean"
                                : "bg-green-pale text-green"
                            }`}
                          >
                            {theme}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
