"use client";

import { useAgeMode } from "@/hooks/useAgeMode";

export function JourneyCompleteSummary({
  journeyTitle,
  principles,
}: {
  journeyTitle: string;
  principles: string[];
}) {
  const { ageMode } = useAgeMode();
  const max = ageMode === "adult" ? 5 : 3;
  const shown = principles.slice(0, max);

  return (
    <>
      <p className="mb-4 font-[family-name:var(--font-lora)] text-sm leading-relaxed text-ink-muted">
        {ageMode === "adult" ? (
          <>
            You followed <strong className="text-ink">{journeyTitle}</strong>{" "}
            from beginning to end. Here are some through-lines from the
            principles in these stories — threads you might keep reflecting on
            or ask Keith about.
          </>
        ) : (
          <>
            Great job finishing{" "}
            <strong className="text-ink">{journeyTitle}</strong>! Here are a
            few big ideas from the stories you read.
          </>
        )}
      </p>
      <ul className="mb-8 space-y-2">
        {shown.map((p, i) => (
          <li
            key={i}
            className="flex gap-2 border-l-2 border-clay-mid pl-3 font-[family-name:var(--font-lora)] text-sm text-ink"
          >
            {p}
          </li>
        ))}
      </ul>
    </>
  );
}
