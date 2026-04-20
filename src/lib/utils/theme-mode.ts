import type { ThemeMode } from "@/types";

export type ThemeResolvedMode = "light" | "dark";

export const THEME_MODE_SEQUENCE: ThemeMode[] = ["light", "dark", "auto"];

export function resolveThemeMode(
  mode: ThemeMode,
  systemMode: ThemeResolvedMode
): ThemeResolvedMode {
  if (mode === "auto") return systemMode;
  return mode;
}

export function nextThemeMode(mode: ThemeMode): ThemeMode {
  const idx = THEME_MODE_SEQUENCE.indexOf(mode);
  if (idx < 0) return "auto";
  return THEME_MODE_SEQUENCE[(idx + 1) % THEME_MODE_SEQUENCE.length];
}

export function themeModeLabel(mode: ThemeMode): string {
  switch (mode) {
    case "light":
      return "Day";
    case "dark":
      return "Night";
    case "auto":
      return "Auto";
  }
}
