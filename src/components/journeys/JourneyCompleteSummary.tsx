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
      <p className="text-stone-600 text-sm leading-relaxed mb-4">
        {ageMode === "adult" ? (
          <>
            You followed <strong>{journeyTitle}</strong> from beginning to end.
            Here are some through-lines from the principles in these stories —
            threads you might keep reflecting on or ask Keith about.
          </>
        ) : (
          <>
            Great job finishing <strong>{journeyTitle}</strong>! Here are a few
            big ideas from the stories you read.
          </>
        )}
      </p>
      <ul className="space-y-2 mb-8">
        {shown.map((p, i) => (
          <li
            key={i}
            className="text-sm text-stone-700 flex gap-2 border-l-2 border-amber-300 pl-3"
          >
            {p}
          </li>
        ))}
      </ul>
    </>
  );
}
