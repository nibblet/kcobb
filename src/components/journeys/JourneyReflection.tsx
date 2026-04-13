"use client";

import { useAgeMode } from "@/hooks/useAgeMode";
import type { AgeMode } from "@/types";

function simplifyForYoungReader(text: string): string {
  const q = text.indexOf("?");
  if (q !== -1) return text.slice(0, q + 1);
  const dot = text.indexOf(".");
  if (dot !== -1 && dot < 100) return text.slice(0, dot + 1);
  return text.length > 100 ? `${text.slice(0, 97)}…` : text;
}

const ADULT_FOLLOW_UP =
  "How does this connect to a decision you've made in your own life?";

function reflectionCopy(mode: AgeMode, base: string): { lead?: string; main: string; extra?: string } {
  switch (mode) {
    case "young_reader":
      return {
        lead: "Think about this:",
        main: simplifyForYoungReader(base),
      };
    case "teen":
      return { main: base };
    case "adult":
      return { main: base, extra: ADULT_FOLLOW_UP };
    default:
      return { main: base };
  }
}

export function JourneyReflection({
  prompt,
}: {
  prompt: string;
}) {
  const { ageMode } = useAgeMode();
  const { lead, main, extra } = reflectionCopy(ageMode, prompt);

  return (
    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 mb-6">
      {ageMode === "young_reader" && (
        <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
          <span aria-hidden>⭐</span>
          {lead}
        </p>
      )}
      <h2 className="text-sm font-semibold text-stone-800 uppercase tracking-wide mb-2">
        Reflection
      </h2>
      <p className="text-sm text-stone-700 leading-relaxed">{main}</p>
      {extra && (
        <p className="text-sm text-stone-600 leading-relaxed mt-3 pt-3 border-t border-amber-200/80">
          {extra}
        </p>
      )}
    </div>
  );
}
