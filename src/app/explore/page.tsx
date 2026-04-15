import Link from "next/link";
import { buildChordMatrix, buildThemeGraph } from "@/lib/wiki/graph";
import { ForceGraph } from "@/components/viz/ForceGraph";
import { ChordDiagram } from "@/components/viz/ChordDiagram";

export const metadata = {
  title: "Explore — Keith Cobb Storybook",
  description:
    "Visual explorations of how themes, principles, and stories intermingle across Keith's life.",
};

export default function ExplorePage() {
  const graph = buildThemeGraph();
  const chord = buildChordMatrix();

  return (
    <div className="mx-auto max-w-wide px-[var(--page-padding-x)] py-6 md:py-10">
      <div className="mb-8">
        <h1 className="type-page-title mb-2">Explore the Connections</h1>
        <p className="type-ui max-w-xl text-ink-muted">
          Two ways to see how themes, principles, and stories weave together.
          This page is a prototype — tell us which one feels right and we&apos;ll
          polish it.
        </p>
      </div>

      <section className="mb-14">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-burgundy">
            1. Story &amp; Theme Network
          </h2>
          <Link
            href="/themes"
            className="type-ui text-ocean hover:text-ocean-light"
          >
            Themes index →
          </Link>
        </div>
        <p className="type-ui mb-4 max-w-3xl text-ink-muted">
          Each large dot is a theme; small dots are stories. Lines connect a
          story to every theme it embodies. Themes that share many stories end
          up drifting toward each other — the shape of the cluster is the
          intermingling.
        </p>
        <ForceGraph data={graph} />
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-burgundy">
            2. Theme Chord Diagram
          </h2>
          <Link
            href="/stories"
            className="type-ui text-ocean hover:text-ocean-light"
          >
            Stories index →
          </Link>
        </div>
        <p className="type-ui mb-4 max-w-3xl text-ink-muted">
          Each arc around the perimeter is a theme, sized by how many story-ties
          it has. Ribbons show pairs of themes that co-occur in the same story;
          thicker ribbons mean more shared stories.
        </p>
        <ChordDiagram data={chord} />
      </section>
    </div>
  );
}
