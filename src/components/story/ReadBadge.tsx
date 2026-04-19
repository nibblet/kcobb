interface ReadBadgeProps {
  /** Defaults to "Read"; use {@link ReadBadgeAgeAware} for age-mode-aware labeling. */
  label?: string;
  className?: string;
}

/** Small label for stories the signed-in user has already opened (tracked via ReadTracker). */
export function ReadBadge({ label = "Read", className }: ReadBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border border-[color-mix(in_srgb,var(--color-gold)_35%,transparent)] bg-gold-pale px-2 py-0.5 text-[10px] font-medium leading-none text-gold ${className ?? ""}`}
    >
      {label}
    </span>
  );
}
