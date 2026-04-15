"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ThemeGraph } from "@/lib/wiki/graph";

interface Props {
  data: ThemeGraph;
}

interface SimNode {
  id: string;
  kind: "theme" | "story";
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  storyCount?: number;
  themeCount?: number;
  title?: string;
  summary?: string;
  slug?: string;
  name?: string;
}

interface SimLink {
  source: SimNode;
  target: SimNode;
}

interface Sim {
  nodes: SimNode[];
  links: SimLink[];
}

const WIDTH = 900;
const HEIGHT = 620;

/**
 * Palette for themes — aligned to the site's color tokens so the graph feels
 * like part of the storybook, not a data-science artifact.
 */
const THEME_COLORS: Record<string, string> = {
  integrity: "#8b2c2c",
  leadership: "#b5451b",
  "work-ethic": "#c8662a",
  mentorship: "#d4a843",
  family: "#a04a4a",
  community: "#3d6b35",
  curiosity: "#4a7fa0",
  identity: "#6b1e1e",
  gratitude: "#6ba35a",
  adversity: "#6b5040",
  "financial-responsibility": "#7ab3c9",
  "career-choices": "#2f5d7a",
};

function themeColor(slug: string): string {
  return THEME_COLORS[slug] || "#b5451b";
}

/** Deterministic [0,1) pseudo-random from a string — stable across renders. */
function hashUnit(s: string): number {
  let hash = 2166136261;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

function buildSim(data: ThemeGraph): Sim {
  const byId = new Map<string, SimNode>();

  const nThemes = data.themes.length;
  data.themes.forEach((t, i) => {
    const a = (i / Math.max(1, nThemes)) * Math.PI * 2 - Math.PI / 2;
    byId.set(t.id, {
      id: t.id,
      kind: "theme",
      label: t.name,
      x: WIDTH / 2 + Math.cos(a) * 180,
      y: HEIGHT / 2 + Math.sin(a) * 180,
      vx: 0,
      vy: 0,
      radius: 14 + Math.min(18, t.storyCount * 1.2),
      storyCount: t.storyCount,
      name: t.name,
    });
  });

  for (const s of data.stories) {
    const jx = hashUnit(s.id + "x");
    const jy = hashUnit(s.id + "y");
    byId.set(s.id, {
      id: s.id,
      kind: "story",
      label: s.title,
      x: jx * WIDTH,
      y: jy * HEIGHT,
      vx: 0,
      vy: 0,
      radius: 4.5 + Math.min(4, s.themeCount * 0.7),
      themeCount: s.themeCount,
      title: s.title,
      summary: s.summary,
      slug: s.slug,
    });
  }

  const links: SimLink[] = [];
  for (const l of data.links) {
    const src = byId.get(l.source);
    const tgt = byId.get(l.target);
    if (src && tgt) links.push({ source: src, target: tgt });
  }

  return { nodes: Array.from(byId.values()), links };
}

export function ForceGraph({ data }: Props) {
  // Simulation state lives in useState. The rAF loop mutates the contained
  // objects in place and bumps `tick` to trigger a re-render — this keeps
  // React's render function free of ref reads while still allowing the
  // cheaper-than-reconciliation object mutation pattern the sim wants.
  const [sim, setSim] = useState<Sim>(() => buildSim(data));
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    setSim(buildSim(data));
  }, [data]);

  useEffect(() => {
    let alpha = 1.0;
    const alphaDecay = 0.0115;
    const alphaMin = 0.02;
    let raf: number | null = null;

    const step = () => {
      const { nodes, links } = sim;

      // 1) repulsion (all-pairs; N ≈ 50, fine)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy + 0.01;
          const d = Math.sqrt(d2);
          const strength =
            a.kind === "theme" && b.kind === "theme" ? 2400 : 800;
          const force = strength / d2;
          const fx = (dx / d) * force * alpha;
          const fy = (dy / d) * force * alpha;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }

      // 2) spring links (theme <-> story)
      for (const l of links) {
        const a = l.source;
        const b = l.target;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const targetLen = 95;
        const k = 0.06;
        const diff = (d - targetLen) * k * alpha;
        const fx = (dx / d) * diff;
        const fy = (dy / d) * diff;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }

      // 3) center pull + damping + integration + walls
      for (const n of nodes) {
        const cxPull = (WIDTH / 2 - n.x) * (n.kind === "theme" ? 0.01 : 0.003);
        const cyPull = (HEIGHT / 2 - n.y) * (n.kind === "theme" ? 0.01 : 0.003);
        n.vx = (n.vx + cxPull) * 0.82;
        n.vy = (n.vy + cyPull) * 0.82;
        n.x += n.vx;
        n.y += n.vy;

        const pad = n.radius + 6;
        if (n.x < pad) {
          n.x = pad;
          n.vx *= -0.4;
        }
        if (n.x > WIDTH - pad) {
          n.x = WIDTH - pad;
          n.vx *= -0.4;
        }
        if (n.y < pad) {
          n.y = pad;
          n.vy *= -0.4;
        }
        if (n.y > HEIGHT - pad) {
          n.y = HEIGHT - pad;
          n.vy *= -0.4;
        }
      }

      alpha -= alphaDecay;
      setTick((t) => t + 1);

      if (alpha > alphaMin) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [sim]);

  const focusId = hovered ?? selected;
  const neighbors = useMemo(() => {
    if (!focusId) return new Set<string>();
    const s = new Set<string>([focusId]);
    for (const l of data.links) {
      if (l.source === focusId) s.add(l.target);
      if (l.target === focusId) s.add(l.source);
    }
    return s;
  }, [focusId, data.links]);

  const { nodes, links } = sim;
  const selectedNode = selected ? nodes.find((n) => n.id === selected) : null;

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-warm-white-2">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Network graph of themes and stories"
          className="block h-auto w-full touch-none"
          onClick={() => setSelected(null)}
        >
          <g stroke="currentColor" className="text-ink-ghost">
            {links.map((l, i) => {
              const dim =
                focusId && !(neighbors.has(l.source.id) && neighbors.has(l.target.id));
              return (
                <line
                  key={i}
                  x1={l.source.x}
                  y1={l.source.y}
                  x2={l.target.x}
                  y2={l.target.y}
                  strokeOpacity={dim ? 0.06 : 0.35}
                  strokeWidth={1}
                />
              );
            })}
          </g>

          <g>
            {nodes
              .filter((n) => n.kind === "story")
              .map((n) => {
                const dim = focusId && !neighbors.has(n.id);
                return (
                  <circle
                    key={n.id}
                    cx={n.x}
                    cy={n.y}
                    r={n.radius}
                    fill="var(--color-warm-white)"
                    stroke="var(--color-clay)"
                    strokeWidth={1.25}
                    opacity={dim ? 0.2 : 0.95}
                    className="cursor-pointer"
                    onMouseEnter={() => setHovered(n.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected((prev) => (prev === n.id ? null : n.id));
                    }}
                  />
                );
              })}
          </g>

          <g>
            {nodes
              .filter((n) => n.kind === "theme")
              .map((n) => {
                const color = themeColor(n.id);
                const dim = focusId && !neighbors.has(n.id);
                return (
                  <g
                    key={n.id}
                    onMouseEnter={() => setHovered(n.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected((prev) => (prev === n.id ? null : n.id));
                    }}
                    className="cursor-pointer"
                    opacity={dim ? 0.35 : 1}
                  >
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={n.radius}
                      fill={color}
                      stroke="var(--color-warm-white)"
                      strokeWidth={2}
                    />
                    <text
                      x={n.x}
                      y={n.y + n.radius + 14}
                      textAnchor="middle"
                      fontFamily="var(--font-playfair), Georgia, serif"
                      fontSize={13}
                      fontWeight={600}
                      fill="var(--color-ink)"
                      style={{ pointerEvents: "none" }}
                    >
                      {n.label}
                    </text>
                  </g>
                );
              })}
          </g>
        </svg>
      </div>

      {selectedNode && (
        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-warm-white p-4">
          {selectedNode.kind === "theme" ? (
            <>
              <div className="type-meta text-ink-ghost">Theme</div>
              <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-burgundy">
                {selectedNode.name}
              </h3>
              <p className="type-ui mt-1 text-ink-muted">
                {selectedNode.storyCount} stories explore this theme.
              </p>
              <Link
                href={`/themes/${selectedNode.id}`}
                className="type-ui mt-3 inline-block text-ocean hover:text-ocean-light"
              >
                Open theme →
              </Link>
            </>
          ) : (
            <>
              <div className="type-meta text-ink-ghost">Story · {selectedNode.id}</div>
              <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-ink">
                {selectedNode.title}
              </h3>
              <p className="font-[family-name:var(--font-lora)] mt-1 text-sm leading-relaxed text-ink-muted">
                {selectedNode.summary}
              </p>
              <Link
                href={`/stories/${selectedNode.slug}`}
                className="type-ui mt-3 inline-block text-ocean hover:text-ocean-light"
              >
                Read story →
              </Link>
            </>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-4 text-ink-muted">
        <span className="inline-flex items-center gap-2 text-[0.75rem]">
          <span className="inline-block h-3 w-3 rounded-full bg-burgundy" />
          Theme
        </span>
        <span className="inline-flex items-center gap-2 text-[0.75rem]">
          <span
            className="inline-block h-3 w-3 rounded-full border border-clay"
            style={{ background: "var(--color-warm-white)" }}
          />
          Story
        </span>
        <span className="text-[0.75rem] italic">
          Hover to highlight neighborhood · click for details
        </span>
      </div>
    </div>
  );
}
