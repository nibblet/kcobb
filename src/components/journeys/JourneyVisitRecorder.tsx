"use client";

import { useEffect } from "react";
import { useJourneyProgress } from "@/hooks/useJourneyProgress";

export function JourneyVisitRecorder({
  slug,
  step,
}: {
  slug: string;
  step: number;
}) {
  const { recordVisit } = useJourneyProgress(slug);

  useEffect(() => {
    recordVisit(slug, step);
  }, [slug, step, recordVisit]);

  return null;
}
