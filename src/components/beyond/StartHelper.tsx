"use client";

import { useEffect, useState } from "react";

interface StoryReference {
  storyId: string;
  title: string;
  excerpt: string;
}

interface HelperResult {
  intro: string;
  questions: string[];
  topic: string;
  usedStories: StoryReference[];
}

interface Props {
  initialTopic?: string;
  initialSnippetId?: string;
  // Whether to auto-fetch on mount (true when seeded from a snippet).
  autoStart?: boolean;
  // Append text to the draft body. Caller decides how to combine.
  onAppend: (markdown: string) => void;
  onClose?: () => void;
}

export function StartHelper({
  initialTopic = "",
  initialSnippetId,
  autoStart = false,
  onAppend,
  onClose,
}: Props) {
  const [topic, setTopic] = useState(initialTopic);
  const [snippetId] = useState<string | undefined>(initialSnippetId);
  const [result, setResult] = useState<HelperResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [openQ, setOpenQ] = useState<number | null>(null);

  async function generate(t: string, sid?: string) {
    if (!t.trim() && !sid) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAnswers({});
    setOpenQ(null);
    try {
      const res = await fetch("/api/beyond/start-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t.trim() || undefined, snippetId: sid }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? "Failed");
      }
      const d = (await res.json()) as HelperResult;
      setResult(d);
      if (d.topic && !topic) setTopic(d.topic);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autoStart && (initialTopic || initialSnippetId)) {
      generate(initialTopic, initialSnippetId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function appendIntro() {
    if (!result?.intro) return;
    onAppend(result.intro + "\n\n");
  }

  function appendAnswer(idx: number) {
    const a = answers[idx]?.trim();
    if (!a) return;
    onAppend(a + "\n\n");
    setAnswers((prev) => ({ ...prev, [idx]: "" }));
    setOpenQ(null);
  }

  return (
    <div className="rounded-lg border border-clay/30 bg-warm-white p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="type-display text-sm font-semibold text-clay">
            Help me get started
          </h3>
          <p className="type-ui text-xs text-ink-muted">
            AI will use your existing stories &amp; snippets to ground an opening
            paragraph and suggest interview questions.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="type-ui text-xs text-ink-ghost transition-colors hover:text-clay"
          >
            Close
          </button>
        )}
      </div>

      <div className="mb-3 flex gap-2">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What do you want to write about?"
          className="type-ui flex-1 rounded border border-[var(--color-border)] bg-warm-white-2 px-3 py-1.5 text-sm text-ink placeholder:text-ink-ghost"
        />
        <button
          type="button"
          onClick={() => generate(topic, snippetId)}
          disabled={loading || (!topic.trim() && !snippetId)}
          className="type-ui inline-flex items-center gap-2 rounded bg-clay px-3 py-1.5 text-sm font-medium text-warm-white transition-colors hover:bg-clay-mid disabled:opacity-50"
        >
          {loading && (
            <span
              className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-warm-white/40 border-t-warm-white"
              aria-hidden
            />
          )}
          {loading ? "Thinking…" : result ? "Regenerate" : "Get help"}
        </button>
      </div>

      {loading && (
        <div className="mb-3 flex items-center gap-2 rounded border border-clay/20 bg-warm-white-2 px-3 py-2">
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-clay/30 border-t-clay"
            aria-hidden
          />
          <span className="type-ui text-xs text-ink-muted">
            Reading your stories and snippets to ground the response…
          </span>
        </div>
      )}

      {error && <p className="type-ui mb-3 text-xs text-red-800">{error}</p>}

      {result && (
        <div className="space-y-4">
          {result.intro && (
            <div className="rounded border border-[var(--color-border)] bg-warm-white-2 p-3">
              <p className="font-[family-name:var(--font-lora)] text-sm leading-relaxed text-ink">
                {result.intro}
              </p>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={appendIntro}
                  className="type-ui rounded border border-clay px-2 py-1 text-xs font-medium text-clay transition-colors hover:bg-clay hover:text-warm-white"
                >
                  Add intro to draft →
                </button>
              </div>
            </div>
          )}

          {result.usedStories.length > 0 && (
            <p className="type-ui text-[11px] text-ink-ghost">
              Drawing from:{" "}
              {result.usedStories.map((s, i) => (
                <span key={s.storyId}>
                  {i > 0 && ", "}
                  <em>&ldquo;{s.title}&rdquo;</em>
                </span>
              ))}
            </p>
          )}

          {result.questions.length > 0 && (
            <div>
              <p className="type-ui mb-2 text-xs font-medium uppercase tracking-wide text-ink-ghost">
                Questions to spark writing
              </p>
              <ul className="space-y-2">
                {result.questions.map((q, idx) => {
                  const isOpen = openQ === idx;
                  return (
                    <li
                      key={idx}
                      className="rounded border border-[var(--color-border)] bg-warm-white-2"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenQ(isOpen ? null : idx)}
                        className="type-ui flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-warm-white"
                      >
                        <span className="text-clay">{isOpen ? "−" : "+"}</span>
                        <span className="font-[family-name:var(--font-lora)] italic">
                          {q}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="border-t border-[var(--color-border)] p-3">
                          <textarea
                            value={answers[idx] ?? ""}
                            onChange={(e) =>
                              setAnswers((p) => ({ ...p, [idx]: e.target.value }))
                            }
                            rows={4}
                            placeholder="Type your answer here…"
                            className="type-ui w-full rounded border border-[var(--color-border)] bg-warm-white px-2 py-1.5 text-sm leading-relaxed text-ink placeholder:text-ink-ghost"
                          />
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => appendAnswer(idx)}
                              disabled={!answers[idx]?.trim()}
                              className="type-ui rounded border border-clay px-2 py-1 text-xs font-medium text-clay transition-colors hover:bg-clay hover:text-warm-white disabled:opacity-50"
                            >
                              Add to draft →
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
