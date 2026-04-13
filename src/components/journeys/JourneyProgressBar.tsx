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
      <div className="type-ui mb-2 flex flex-wrap items-center justify-between gap-2 text-ink-muted">
        {ageMode === "young_reader" && (
          <span className="font-medium text-ink">
            Story {step} of {total}
          </span>
        )}
        {ageMode === "teen" && (
          <span className="font-medium text-ink">
            Story {step} of {total}{" "}
            <span className="font-normal text-ink-ghost">({pct}%)</span>
          </span>
        )}
        {ageMode === "adult" && (
          <span className="font-medium text-ink">
            Step {step} of {total} — {journeyTitle}
          </span>
        )}
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-[var(--color-divider)]"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Story ${step} of ${total}`}
      >
        <div
          className="h-full rounded-full bg-clay transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
