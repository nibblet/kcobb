"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  readJourneyProgressClient,
  nextStepToContinue,
} from "@/hooks/useJourneyProgress";

export function JourneyIntroContinue({
  slug,
  totalSteps,
}: {
  slug: string;
  totalSteps: number;
}) {
  const [next, setNext] = useState<number | null>(null);

  useEffect(() => {
    const p = readJourneyProgressClient(slug);
    queueMicrotask(() => setNext(nextStepToContinue(p, totalSteps)));
  }, [slug, totalSteps]);

  if (next === null) return null;

  return (
    <Link
      href={`/journeys/${slug}/${next}`}
      className="type-ui mb-4 inline-flex items-center gap-2 rounded-lg border border-clay-border bg-gold-pale px-4 py-2.5 font-medium text-clay transition-colors hover:bg-gold-pale/80"
    >
      Continue where you left off → Story {next}
    </Link>
  );
}
