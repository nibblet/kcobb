"use client";

import { useEffect } from "react";
import { useAgeMode } from "@/hooks/useAgeMode";

export function BodyModeSync() {
  const { ageMode } = useAgeMode();

  useEffect(() => {
    document.body.setAttribute("data-age-mode", ageMode);
  }, [ageMode]);

  return null;
}
