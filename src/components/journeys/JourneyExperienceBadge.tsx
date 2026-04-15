export function JourneyExperienceBadge({
  mode,
}: {
  mode: "guided" | "narrated";
}) {
  const style =
    mode === "narrated"
      ? {
          label: "Narrated Journey",
          className: "bg-burgundy-light text-burgundy",
        }
      : {
          label: "Guided Journey",
          className: "bg-gold-pale text-clay",
        };

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.className}`}
    >
      {style.label}
    </span>
  );
}
