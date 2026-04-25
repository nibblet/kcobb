import Link from "next/link";

interface PrincipleRef {
  slug: string;
  shortTitle: string;
}

export function PrinciplesInlineProse({
  principles,
  prefix,
  className,
}: {
  principles: PrincipleRef[];
  prefix: string;
  className?: string;
}) {
  if (principles.length === 0) return null;

  return (
    <p
      className={
        className ??
        "mb-5 font-[family-name:var(--font-lora)] text-base leading-relaxed text-ink-muted"
      }
    >
      {prefix}{" "}
      {principles.map((p, i) => {
        const isLast = i === principles.length - 1;
        const isSecondToLast = i === principles.length - 2;
        const separator = isLast
          ? ""
          : isSecondToLast && principles.length === 2
            ? " and "
            : isSecondToLast
              ? ", and "
              : ", ";
        return (
          <span key={p.slug}>
            <Link
              href={`/principles/${p.slug}`}
              className="font-medium text-clay underline underline-offset-2 hover:text-clay-mid"
            >
              {p.shortTitle}
            </Link>
            {separator}
          </span>
        );
      })}
      .
    </p>
  );
}
