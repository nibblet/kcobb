import { getAllEraAccents, yearToEraKey } from "@/lib/design/era";

interface Point {
  storyId: string;
  year: number;
}

interface Props {
  /** Stories belonging to this journey, in any order. */
  points: Point[];
}

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

/**
 * Compact timeline strip used on journey cards. Era bands as low-opacity
 * background; one filled dot per journey story plotted by year. No labels,
 * no interaction — purely a visual cue for "where this journey sits in
 * Keith's life".
 */
export function JourneyMiniTimeline({ points }: Props) {
  const eras = getAllEraAccents();

  return (
    <div
      className="relative h-3 w-full overflow-hidden rounded-full"
      aria-hidden="true"
    >
      {/* Era bands */}
      {eras.map((era) => {
        const range = ERA_RANGES[era.key];
        const left = pct(range.start);
        const width = pct(range.end) - left;
        return (
          <div
            key={era.key}
            className="absolute top-0 h-full"
            style={{
              left: `${left}%`,
              width: `${width}%`,
              backgroundColor: era.hex,
              opacity: 0.18,
            }}
          />
        );
      })}

      {/* Story dots */}
      {points.map((p) => {
        const era = eras.find((e) => e.key === yearToEraKey(p.year));
        return (
          <span
            key={p.storyId}
            className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-warm-white"
            style={{
              left: `${pct(p.year)}%`,
              backgroundColor: era?.hex ?? "#888",
            }}
          />
        );
      })}
    </div>
  );
}
