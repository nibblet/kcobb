import type { StorySource } from "@/lib/wiki/parser";

const SOURCE_STYLES: Record<
  StorySource,
  { label: string; className: string }
> = {
  memoir: {
    label: "Memoir",
    className: "bg-burgundy-light text-burgundy",
  },
  interview: {
    label: "Interview",
    className: "bg-ocean-pale text-ocean",
  },
  family: {
    label: "Family Story",
    className: "bg-green-pale text-green",
  },
};

export function SourceBadge({
  source,
  className = "",
}: {
  source: StorySource;
  className?: string;
}) {
  if (source === "memoir") return null; // memoir is the default — no badge needed

  const style = SOURCE_STYLES[source];
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${style.className} ${className}`}
    >
      {style.label}
    </span>
  );
}
