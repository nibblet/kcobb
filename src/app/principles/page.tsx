import Link from "next/link";
import { getAllCanonicalPrinciples } from "@/lib/wiki/parser";

function IconAsk({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

      <div className="space-y-6">
        {principles.map((principle) => (
          <article
            key={principle.id}
            id={principle.slug}
            className="scroll-mt-32 rounded-2xl border border-[var(--color-border)] bg-warm-white p-5 md:p-6"
          >
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-burgundy">
              {principle.title}
            </h2>
            <p className="mt-2 font-[family-name:var(--font-lora)] text-base leading-relaxed text-ink">
              {principle.thesis}
            </p>
            <p className="mt-3 font-[family-name:var(--font-lora)] text-sm leading-relaxed text-ink-muted">
              {principle.narrative}
            </p>
            <div className="mt-4">
              <Link
                href={`/ask?prompt=${encodeURIComponent(principle.askPrompt)}`}
                className="type-ui inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-warm-white-2 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-clay-border hover:text-clay"
              >
                <IconAsk className="h-4 w-4 text-clay" />
                Ask about this principle
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
