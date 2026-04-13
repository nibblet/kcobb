"use client";

import { useAgeMode } from "@/hooks/useAgeMode";
import type { AgeMode } from "@/types";
import { ageModeLabel } from "@/lib/utils/age-mode";

const modes: AgeMode[] = ["young_reader", "teen", "adult"];

export function AgeModeSwitcher() {
  const { ageMode, setAgeMode } = useAgeMode();

  return (
    <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-0.5">
      {modes.map((mode) => (
        <button
          key={mode}
          onClick={() => setAgeMode(mode)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            ageMode === mode
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          {ageModeLabel(mode)}
        </button>
      ))}
    </div>
  );
}
