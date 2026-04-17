import Link from "next/link";
import { getAllPeople } from "@/lib/wiki/parser";

export default function PeoplePage() {
  const people = getAllPeople();

  return (
    <div className="mx-auto max-w-wide px-[var(--page-padding-x)] py-6 md:py-10">
      <div className="mx-auto max-w-content">
        <h1 className="type-page-title mb-2">People</h1>
        <p className="type-ui mb-6 text-ink-muted">
          The family, friends, mentors, and colleagues who appear across
          Keith&apos;s memoir and the interviews. Click any name to see every
          story they appear in.
        </p>

        <p className="type-meta mb-4 text-ink-ghost">
          {people.length} people
        </p>

        <ul className="grid list-none gap-2 sm:grid-cols-2">
          {people.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/people/${p.slug}`}
                className="group flex items-baseline justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-warm-white px-3 py-2 transition-[border-color,box-shadow] hover:border-clay-border hover:shadow-[0_4px_12px_rgba(44,28,16,0.06)]"
              >
                <span className="font-[family-name:var(--font-playfair)] text-base text-ink transition-colors group-hover:text-burgundy">
                  {p.name}
                </span>
                <span className="type-meta shrink-0 normal-case tracking-normal text-ink-ghost">
                  {p.memoirStoryIds.length + p.interviewStoryIds.length} stories
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
