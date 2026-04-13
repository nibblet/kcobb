"use client";

import { useAgeMode } from "@/hooks/useAgeMode";
import type { AgeMode } from "@/types";
import { ageModeLabel } from "@/lib/utils/age-mode";

const modes: AgeMode[] = ["young_reader", "teen", "adult"];

export function AgeModeSwitcher() {
  const { ageMode, setAgeMode } = useAgeMode();

  return (
    <div
      className="inline-flex overflow-hidden rounded-full border border-[var(--color-border)] bg-warm-white"
      role="group"
      aria-label="Reading level"
    >
      {modes.map((mode) => {
        const active = ageMode === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setAgeMode(mode)}
            className={`px-3 py-1 text-xs font-medium transition-[background-color,color] duration-[var(--duration-normal)] ${
              active
                ? "rounded-full bg-ink text-warm-white"
                : "bg-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {ageModeLabel(mode)}
          </button>
        );
      })}
    </div>
  );
}
