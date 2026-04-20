"use client";

import type { ThemeMode } from "@/types";
import { useThemeMode } from "@/hooks/useThemeMode";
import { themeModeLabel } from "@/lib/utils/theme-mode";

const modes: ThemeMode[] = ["light", "dark", "auto"];

type ThemeModeSelectorProps = {
  className?: string;
  helperText?: "full" | "minimal" | "none";
  showLabel?: boolean;
};

export function ThemeModeSelector({
  className,
  helperText = "full",
  showLabel = true,
}: ThemeModeSelectorProps) {
  const { themeMode, resolvedThemeMode, setThemeMode } = useThemeMode();

  return (
    <section className={className}>
      {showLabel && (
        <p className="type-meta normal-case tracking-normal text-[rgba(240,232,213,0.75)]">
          Appearance
        </p>
      )}
      <div
        className={`${showLabel ? "mt-2" : ""} inline-flex overflow-hidden rounded-full border border-[rgba(240,232,213,0.28)] bg-[rgba(36,23,16,0.55)]`}
        role="group"
        aria-label="Appearance mode"
      >
        {modes.map((mode) => {
          const active = themeMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setThemeMode(mode)}
              className={`px-3 py-1 text-xs font-medium transition-[background-color,color] duration-[var(--duration-normal)] ${
                active
                  ? "rounded-full bg-[rgba(240,232,213,0.95)] text-[#2c1c10]"
                  : "text-[rgba(240,232,213,0.8)] hover:text-[#f0e8d5]"
              }`}
            >
              {themeModeLabel(mode)}
            </button>
          );
        })}
      </div>
      {helperText === "full" ? (
        <p className="mt-1.5 text-xs text-[rgba(240,232,213,0.7)]">
          Auto follows your device settings (currently{" "}
          {resolvedThemeMode === "dark" ? "Night" : "Day"}).
        </p>
      ) : helperText === "minimal" ? (
        <p className="mt-1.5 text-xs text-[rgba(240,232,213,0.7)]">
          Auto uses device mode.
        </p>
      ) : null}
    </section>
  );
}
