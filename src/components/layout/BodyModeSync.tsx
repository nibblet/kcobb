"use client";

import { useEffect } from "react";
import { useAgeMode } from "@/hooks/useAgeMode";
import { useThemeMode } from "@/hooks/useThemeMode";

export function BodyModeSync() {
  const { ageMode } = useAgeMode();
  const { themeMode, resolvedThemeMode } = useThemeMode();

  useEffect(() => {
    document.body.setAttribute("data-age-mode", ageMode);
  }, [ageMode]);

  useEffect(() => {
    document.body.setAttribute("data-theme-mode", themeMode);
    document.body.setAttribute("data-theme-resolved", resolvedThemeMode);
  }, [themeMode, resolvedThemeMode]);

  return null;
}
