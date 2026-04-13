"use client";

import { useEffect, useState } from "react";
import {
  readJourneyProgressClient,
  furthestVisitedStep,
} from "@/hooks/useJourneyProgress";

export function JourneyStatusBadge({
  slug,
  totalSteps,
}: {
  slug: string;
  totalSteps: number;
}) {
  const [label, setLabel] = useState<"in_progress" | "completed" | null>(null);

  useEffect(() => {
    const p = readJourneyProgressClient(slug);
    if (!p) {
      setLabel(null);
      return;
    }
    if (p.completed) {
      setLabel("completed");
      return;
    }
    if (furthestVisitedStep(p) > 0) setLabel("in_progress");
    else setLabel(null);
  }, [slug, totalSteps]);

  if (!label) return null;

  return (
    <span
      className={`absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
        label === "completed"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-800"
      }`}
    >
      {label === "completed" ? "Completed" : "In progress"}
    </span>
  );
}
