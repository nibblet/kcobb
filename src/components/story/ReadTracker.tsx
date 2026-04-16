"use client";

import { useEffect } from "react";

export function ReadTracker({ storyId }: { storyId: string }) {
  useEffect(() => {
    fetch(`/api/stories/${storyId}/read`, {
      method: "POST",
      cache: "no-store",
    }).catch(() => {
      // Read tracking is celebratory only; story reading should never fail because of it.
    });
  }, [storyId]);

  return null;
}
