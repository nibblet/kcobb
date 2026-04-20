"use client";

import { useThemeMode } from "@/hooks/useThemeMode";
import { nextThemeMode, themeModeLabel } from "@/lib/utils/theme-mode";

type ThemeModeCycleButtonProps = {
  compact?: boolean;
};

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M10 2.75a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V3.5a.75.75 0 0 1 .75-.75Zm0 12.5a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V16a.75.75 0 0 1 .75-.75Zm7.25-5.25a.75.75 0 0 1 0 1.5H16a.75.75 0 0 1 0-1.5h1.25Zm-12.5 0a.75.75 0 0 1 0 1.5H3.5a.75.75 0 0 1 0-1.5h1.25Zm9.576-4.826a.75.75 0 0 1 1.06 1.06l-.884.885a.75.75 0 0 1-1.06-1.06l.884-.885Zm-8.828 8.828a.75.75 0 1 1 1.06 1.06l-.884.885a.75.75 0 0 1-1.06-1.06l.884-.885Zm9.713 1.945a.75.75 0 0 1-1.06 0l-.885-.884a.75.75 0 1 1 1.06-1.06l.885.884a.75.75 0 0 1 0 1.06Zm-8.828-8.828a.75.75 0 0 1-1.06 0l-.885-.884a.75.75 0 0 1 1.06-1.06l.885.884a.75.75 0 0 1 0 1.06ZM10 6.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M11.8 2.047a.75.75 0 0 1 .468 1.282 6.5 6.5 0 1 0 8.403 8.403.75.75 0 0 1 1.281.468A8 8 0 1 1 11.8 2.047Z" />
    </svg>
  );
}

function AutoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect
        x="2.5"
        y="4"
        width="15"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M10 6.5v7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ThemeModeCycleButton({
  compact = true,
}: ThemeModeCycleButtonProps) {
  const { themeMode, setThemeMode } = useThemeMode();
  const nextMode = nextThemeMode(themeMode);
  const iconClass = compact ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      type="button"
      onClick={() => setThemeMode(nextMode)}
      aria-label={`Theme: ${themeModeLabel(themeMode)}. Switch to ${themeModeLabel(nextMode)}.`}
      title={`Theme: ${themeModeLabel(themeMode)} (click for ${themeModeLabel(nextMode)})`}
      className={
        compact
          ? "inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] text-ink-muted transition-colors hover:text-ink"
          : "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-ink-muted transition-colors hover:text-ink"
      }
    >
      {themeMode === "light" ? (
        <SunIcon className={iconClass} />
      ) : themeMode === "dark" ? (
        <MoonIcon className={iconClass} />
      ) : (
        <AutoIcon className={iconClass} />
      )}
    </button>
  );
}
