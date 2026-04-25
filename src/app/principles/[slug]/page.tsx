import Link from "next/link";
import { notFound } from "next/navigation";
import { ThemePillLink } from "@/components/themes/ThemePillLink";
import { getCanonicalPrincipleBySlug } from "@/lib/wiki/parser";
import { NarrationControls } from "@/components/audio/NarrationControls";
import {
  narrationAudioEndpoint,
  resolvePrincipleNarration,
} from "@/lib/narration/resolve";
import { PageContextBoundary } from "@/components/layout/PageContextBoundary";
import { WhatsNext } from "@/components/nav/WhatsNext";
import { getPrincipleWhatsNext } from "@/lib/navigation/whats-next";

export default async function PrincipleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const principle = getCanonicalPrincipleBySlug(slug);

  if (!principle) notFound();

  const principleNarration = resolvePrincipleNarration(slug);

  return (
    <div className="mx-auto max-w-content px-[var(--page-padding-x)] py-6 md:py-10">
      <PageContextBoundary type="principle" slug={slug} title={principle.title} />
      <Link
        href="/principles"
        className="type-ui mb-4 inline-block text-ink-ghost no-underline transition-colors hover:text-ocean"
      >
        &larr; All Principles
      </Link>

      <div className="rounded-2xl border border-[var(--color-border)] bg-warm-white p-6">
        <h1 className="type-page-title">{principle.title}</h1>

        <div className="mt-5">
          <p className="type-meta mb-2 text-ink-ghost">Themes</p>
          <div className="flex flex-wrap gap-2">
            {principle.relatedThemes.map((theme) => (
              <ThemePillLink
                key={theme.slug}
                href={`/themes/${theme.slug}`}
              >
                {theme.name}
              </ThemePillLink>
            ))}
          </div>
        </div>
      </div>

      {principleNarration && (
        <div className="mt-6">
          <NarrationControls
            playbackKey={principleNarration.contentHash}
            title={principle.title}
            fullText={principleNarration.speechBodyPlain}
            wordCount={principleNarration.wordCount}
            audioEndpoint={narrationAudioEndpoint(principleNarration)}
          />
        </div>
      )}

      <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-warm-white p-5">
        <div className="space-y-4">
          {principle.aiNarrative.split("\n\n").map((paragraph, i) => (
            <p
              key={i}
              className="font-[family-name:var(--font-lora)] text-base leading-relaxed text-ink-muted"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {principle.stories.length > 0 && (
        <section className="mt-6">
          <h2 className="type-meta mb-3 text-ink">
            Stories Where This Shows Up
          </h2>
          <div className="space-y-3">
            {principle.stories.map((story) => (
              <Link
                key={story.storyId}
                href={`/stories/${story.storyId}`}
                className="block rounded-xl border border-[var(--color-border)] bg-warm-white p-4 transition-colors hover:border-clay-border"
              >
                <span className="type-ui block text-ink">{story.title}</span>
                <span className="mt-1 block font-[family-name:var(--font-lora)] text-sm text-ink-muted">
                  {story.summary}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {principle.supportingStatements.length > 0 && (
        <details className="mt-6 rounded-2xl border border-[var(--color-border)] bg-warm-white p-5">
          <summary className="type-meta cursor-pointer text-ink">
            Supporting Evidence ({principle.supportingStatements.length})
          </summary>
          <ul className="mt-4 space-y-3">
            {principle.supportingStatements.map((statement) => (
              <li
                key={statement.id}
                className="font-[family-name:var(--font-lora)] text-sm text-ink-muted"
              >
                <span className="mr-2 text-clay">&#9679;</span>
                {statement.label}
                {statement.stories[0] ? (
                  <Link
                    href={`/stories/${statement.stories[0].storyId}`}
                    className="ml-1 text-xs text-ocean hover:underline"
                  >
                    ({statement.stories[0].title})
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      )}

      <WhatsNext
        data={getPrincipleWhatsNext({
          slug,
          title: principle.title,
          backingStories: principle.stories.map((s) => ({
            storyId: s.storyId,
            title: s.title,
            summary: s.summary,
          })),
        })}
      />
    </div>
  );
}
