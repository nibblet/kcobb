import Link from "next/link";
import type { ProfileReadingDashboardData } from "@/lib/analytics/profile-dashboard";

function formatRelativeDate(value: string | null): string {
  if (!value) return "No stories yet";

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProfileReadingDashboard({
  readCount,
  mostRecentReadAt,
  topThemes,
  topPrinciples,
}: ProfileReadingDashboardData) {
  return (
    <section className="relative border-t border-[rgba(240,232,213,0.12)] bg-[#241710] text-[#f0e8d5]">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,168,67,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-wide px-[var(--page-padding-x)] py-12 md:py-16">
        <div className="mb-8 max-w-2xl">
          <p className="type-era-label mb-3 text-[rgba(240,232,213,0.62)]">
            Your Reading Trail
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-[clamp(1.75rem,3vw,2.5rem)] font-semibold text-[#f0e8d5]">
            A few signals from where you&apos;ve been spending time.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-[rgba(240,232,213,0.12)] bg-[rgba(240,232,213,0.04)] p-5">
            <p className="type-era-label text-[rgba(240,232,213,0.5)]">
              Stories read
            </p>
            <p className="mt-3 font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[#f0e8d5]">
              {readCount}
            </p>
            <p className="mt-2 font-[family-name:var(--font-inter)] text-sm text-[rgba(240,232,213,0.62)]">
              Quiet progress through the library
            </p>
          </div>

          <div className="rounded-[24px] border border-[rgba(240,232,213,0.12)] bg-[rgba(240,232,213,0.04)] p-5">
            <p className="type-era-label text-[rgba(240,232,213,0.5)]">
              Most recent read
            </p>
            <p className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#f0e8d5]">
              {formatRelativeDate(mostRecentReadAt)}
            </p>
            <p className="mt-2 font-[family-name:var(--font-inter)] text-sm text-[rgba(240,232,213,0.62)]">
              Your latest visit into Keith&apos;s stories
            </p>
          </div>

          <div className="rounded-[24px] border border-[rgba(240,232,213,0.12)] bg-[rgba(240,232,213,0.04)] p-5">
            <p className="type-era-label text-[rgba(240,232,213,0.5)]">
              Strongest theme
            </p>
            <p className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#f0e8d5]">
              {topThemes[0]?.name || "Still forming"}
            </p>
            <p className="mt-2 font-[family-name:var(--font-inter)] text-sm text-[rgba(240,232,213,0.62)]">
              {topThemes[0]
                ? `Seen in ${topThemes[0].count} read stor${
                    topThemes[0].count === 1 ? "y" : "ies"
                  }`
                : "Read a few stories and patterns will appear here"}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] border border-[rgba(240,232,213,0.12)] bg-[rgba(240,232,213,0.04)] p-6">
            <p className="type-era-label text-[rgba(240,232,213,0.5)]">
              Most visited themes
            </p>
            <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl text-[#f0e8d5]">
              Where you keep returning
            </h3>

            {topThemes.length === 0 ? (
              <p className="mt-5 font-[family-name:var(--font-inter)] text-sm text-[rgba(240,232,213,0.62)]">
                Themes will start to emerge after you read a few stories.
              </p>
            ) : (
              <div className="mt-5 flex flex-wrap gap-2">
                {topThemes.map((theme) => (
                  <Link
                    key={theme.name}
                    href={`/themes/${theme.name.toLowerCase().replace(/\s+/g, "-")}`}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(122,179,201,0.28)] bg-[rgba(74,127,160,0.16)] px-3 py-1.5 font-[family-name:var(--font-inter)] text-sm font-medium text-[#e8f4f8] transition-colors hover:bg-[rgba(74,127,160,0.26)]"
                  >
                    <span>{theme.name}</span>
                    <span className="rounded-full bg-[rgba(240,232,213,0.12)] px-2 py-0.5 text-xs text-[#f0e8d5]">
                      {theme.count}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-[rgba(240,232,213,0.12)] bg-[rgba(240,232,213,0.04)] p-6">
            <p className="type-era-label text-[rgba(240,232,213,0.5)]">
              Principles showing up
            </p>
            <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl text-[#f0e8d5]">
              Ideas you&apos;ve encountered most
            </h3>

            {topPrinciples.length === 0 ? (
              <p className="mt-5 font-[family-name:var(--font-inter)] text-sm text-[rgba(240,232,213,0.62)]">
                Principle patterns will fill in as you work through more of the library.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {topPrinciples.map((principle) => (
                  <div
                    key={principle.text}
                    className="rounded-2xl border border-[rgba(240,232,213,0.1)] bg-[rgba(240,232,213,0.03)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-[family-name:var(--font-lora)] text-sm leading-relaxed text-[#f0e8d5]">
                        {principle.text}
                      </p>
                      <span className="shrink-0 rounded-full bg-[rgba(212,168,67,0.18)] px-2.5 py-0.5 font-[family-name:var(--font-inter)] text-xs font-semibold text-[#f5e8c8]">
                        {principle.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
