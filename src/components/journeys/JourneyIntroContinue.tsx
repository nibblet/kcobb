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
    setNext(nextStepToContinue(p, totalSteps));
  }, [slug, totalSteps]);

  if (next === null) return null;

  return (
    <Link
      href={`/journeys/${slug}/${next}`}
      className="inline-flex items-center gap-2 text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-lg hover:bg-amber-100 transition-colors mb-4"
    >
      Continue where you left off → Story {next}
    </Link>
  );
}
