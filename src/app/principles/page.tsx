import Link from "next/link";
import { getAllCanonicalPrinciples } from "@/lib/wiki/parser";

export default function PrinciplesPage() {
  const principles = getAllCanonicalPrinciples();

  return (
    <div className="mx-auto max-w-content px-[var(--page-padding-x)] py-6 md:py-10">
      <h1 className="type-page-title mb-2">Keith&apos;s Principles</h1>
      <p className="type-ui mb-8 max-w-2xl text-ink-muted">
        Twelve recurring principles that show up across Keith&apos;s stories.
        Each one is a pattern, not a rule — built from moments and choices
        repeated over a lifetime.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {principles.map((principle) => (
          <Link
            key={principle.id}
            href={`/principles/${principle.slug}`}
            className="block rounded-2xl border border-[var(--color-border)] bg-warm-white p-5 transition-colors hover:border-clay-border"
          >
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-burgundy">
              {principle.title}
            </h2>
            <p className="mt-2 font-[family-name:var(--font-lora)] text-sm leading-relaxed text-ink-muted">
              {principle.thesis}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
