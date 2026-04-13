import Link from "next/link";
import { getAllThemes } from "@/lib/wiki/parser";

export default function ThemesPage() {
  const themes = getAllThemes();

  return (
    <div className="mx-auto max-w-content px-[var(--page-padding-x)] py-6 md:py-10">
      <h1 className="type-page-title mb-2">Themes &amp; Principles</h1>
      <p className="type-ui mb-6 text-ink-muted">
        The values and principles that shaped Keith&apos;s decisions
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {themes.map((theme) => (
          <Link
            key={theme.slug}
            href={`/themes/${theme.slug}`}
            className="group rounded-xl border border-[var(--color-border)] bg-warm-white p-4 transition-[border-color,box-shadow] hover:border-clay-border hover:shadow-[0_8px_24px_rgba(44,28,16,0.06)]"
          >
            <h2 className="font-[family-name:var(--font-playfair)] text-base font-semibold text-ink transition-colors group-hover:text-burgundy">
              {theme.name}
            </h2>
            <p className="type-meta mt-1 normal-case tracking-normal text-ink-ghost">
              {theme.storyCount} stories &middot; {theme.principles.length}{" "}
              principles
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
