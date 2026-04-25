"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getAllEraAccents, yearToEraKey } from "@/lib/design/era";

interface TimelinePoint {
  storyId: string;
  title: string;
  year: number;
}

interface Props {
  currentStoryId: string;
  points: TimelinePoint[];
}

/** Bands chained so adjacent eras share boundaries (no visual gap). */
const ERA_RANGES: Record<string, { start: number; end: number }> = {
  red_clay: { start: 1935, end: 1955 },
  coming_of_age: { start: 1955, end: 1968 },
  building: { start: 1968, end: 1980 },
  leadership: { start: 1980, end: 1998 },
  legacy: { start: 1998, end: 2025 },
};

const DOMAIN_START = 1935;
const DOMAIN_END = 2025;
const DOMAIN_SPAN = DOMAIN_END - DOMAIN_START;

function pct(year: number): number {
  return ((year - DOMAIN_START) / DOMAIN_SPAN) * 100;
}

export function StoryTimelineStrip({ currentStoryId, points }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const eras = useMemo(() => getAllEraAccents(), []);
  const current = points.find((p) => p.storyId === currentStoryId);
  const others = points.filter((p) => p.storyId !== currentStoryId);
  const hovered = hoveredId
    ? points.find((p) => p.storyId === hoveredId)
    : null;
  const tooltipPoint = hovered ?? current ?? null;

  return (
    <div
      className="mb-5 select-none"
      role="navigation"
      aria-label="Where this story sits in Keith's life"
    >
      <div className="relative h-12">
        {/* Era bands — absolute positioned to align with year-positioned dots */}
        <div className="absolute inset-x-0 top-3 h-6 overflow-hidden rounded-md">
          {eras.map((era) => {
            const range = ERA_RANGES[era.key];
            const left = pct(range.start);
            const width = pct(range.end) - left;
            return (
              <div
                key={era.key}
                title={`${era.label} · ${range.start}–${range.end}`}
                className="absolute h-full"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  backgroundColor: era.hex,
                  opacity: 0.18,
                }}
              />
            );
          })}
        </div>

        {/* Other story dots */}
        {others.map((p) => {
          const era = yearToEraKey(p.year);
          const accent = eras.find((e) => e.key === era);
          return (
            <Link
              key={p.storyId}
              href={`/stories/${p.storyId}`}
              onMouseEnter={() => setHoveredId(p.storyId)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(p.storyId)}
              onBlur={() => setHoveredId(null)}
              aria-label={`${p.title} (${p.year})`}
              className="absolute top-5 h-2 w-2 -translate-x-1/2 rounded-full opacity-50 transition-all hover:scale-150 hover:opacity-100 focus:scale-150 focus:opacity-100 focus:outline-none"
              style={{
                left: `${pct(p.year)}%`,
                backgroundColor: accent?.hex ?? "#888",
              }}
            />
          );
        })}

        {/* Current story dot */}
        {current && (
          <div
            className="absolute top-3 h-6 w-3 -translate-x-1/2 rounded-full ring-2 ring-warm-white"
            style={{
              left: `${pct(current.year)}%`,
              backgroundColor:
                eras.find((e) => e.key === yearToEraKey(current.year))?.hex ??
                "#000",
            }}
            aria-hidden="true"
          />
        )}

        {/* Year ticks at decade boundaries */}
        <div className="absolute inset-x-0 bottom-0 h-3 text-[0.625rem] text-ink-ghost">
          {[1940, 1960, 1980, 2000, 2020].map((year) => (
            <span
              key={year}
              className="absolute -translate-x-1/2"
              style={{ left: `${pct(year)}%` }}
            >
              {year}
            </span>
          ))}
        </div>
      </div>

      {/* Tooltip / current label */}
      {tooltipPoint && (
        <p className="mt-1 text-center text-xs text-ink-muted">
          {tooltipPoint.storyId === currentStoryId ? (
            <>
              <span className="font-medium text-ink">{tooltipPoint.year}</span>{" "}
              · This story
            </>
          ) : (
            <>
              <span className="font-medium text-ink">{tooltipPoint.year}</span>{" "}
              · {tooltipPoint.title}
            </>
          )}
        </p>
      )}
    </div>
  );
}
