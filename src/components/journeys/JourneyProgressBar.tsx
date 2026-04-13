"use client";

import { useAgeMode } from "@/hooks/useAgeMode";

export function JourneyProgressBar({
  step,
  total,
  journeyTitle,
}: {
  step: number;
  total: number;
  journeyTitle: string;
}) {
  const { ageMode } = useAgeMode();
  const pct = total > 0 ? Math.round((step / total) * 100) : 0;

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2 justify-between text-sm text-stone-600 mb-2">
        {ageMode === "young_reader" && (
          <span className="flex items-center gap-1.5 font-medium text-stone-700">
            <span aria-hidden>📖</span>
            Story {step} of {total}
          </span>
        )}
        {ageMode === "teen" && (
          <span className="font-medium text-stone-700">
            Story {step} of {total}{" "}
            <span className="text-stone-400 font-normal">({pct}%)</span>
          </span>
        )}
        {ageMode === "adult" && (
          <span className="font-medium text-stone-700">
            Step {step} of {total} — {journeyTitle}
          </span>
        )}
      </div>
      <div
        className="h-2 bg-stone-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Story ${step} of ${total}`}
      >
        <div
          className="h-full bg-amber-600 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
