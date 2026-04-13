"use client";

import { useEffect } from "react";
import { useJourneyProgress } from "@/hooks/useJourneyProgress";

export function JourneyCompleteMarker({ slug }: { slug: string }) {
  const { markComplete } = useJourneyProgress(slug);

  useEffect(() => {
    markComplete(slug);
  }, [slug, markComplete]);

  return null;
}
