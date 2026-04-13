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

function reflectionCopy(
  mode: AgeMode,
  base: string
): { lead?: string; main: string; extra?: string } {
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
    <div className="mb-6 rounded-xl border border-clay-border bg-gold-pale/50 p-5">
      {ageMode === "young_reader" && (
        <p className="type-ui mb-2 font-semibold text-clay">{lead}</p>
      )}
      <h2 className="type-meta mb-2 text-ink">Reflection</h2>
      <p className="font-[family-name:var(--font-lora)] text-sm leading-relaxed text-ink">
        {main}
      </p>
      {extra && (
        <p className="mt-3 border-t border-clay-border/60 pt-3 font-[family-name:var(--font-lora)] text-sm leading-relaxed text-ink-muted">
          {extra}
        </p>
      )}
    </div>
  );
}
