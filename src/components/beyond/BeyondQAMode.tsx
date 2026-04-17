"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Question {
  id: string;
  story_id: string;
  question: string;
  category: string | null;
  age_mode: string | null;
  created_at: string;
  // present after answering locally
  _answered?: boolean;
}

type Visibility = "public" | "private";

const CATEGORY_LABEL: Record<string, string> = {
  person: "About a person",
  place: "About a place",
  object: "About something in the story",
  timeline: "About when it happened",
  other: "Other",
};

function AnswerPanel({
  question,
  onAnswered,
  onTurnIntoChapter,
}: {
  question: Question;
  onAnswered: () => void;
  onTurnIntoChapter: () => void;
}) {
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/beyond/questions/${question.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer_text: text.trim(), visibility }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? "Failed");
      }
      onAnswered();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answer.");
    } finally {
      setSubmitting(false);
    }
  }

  async function turnIntoChapter() {
    setSeeding(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/beyond/questions/${question.id}/seed-session`,
        { method: "POST" }
      );
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? "Failed");
      }
      // Navigate to Chat — the seeded session will show as "Continue"
      onTurnIntoChapter();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start a chat session.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="mt-3 border-t border-[var(--color-border)] pt-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your answer…"
        rows={4}
        className="type-ui w-full rounded-lg border border-[var(--color-border)] bg-warm-white-2 px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-ink-ghost"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {/* Visibility toggle */}
        <div className="flex rounded-lg border border-[var(--color-border)] bg-warm-white-2 p-0.5 text-xs">
          {(["public", "private"] as Visibility[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVisibility(v)}
              className={`type-ui rounded px-3 py-1 font-medium transition-colors ${
                visibility === v
                  ? "bg-warm-white text-clay shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {v === "public" ? "Public" : "Private"}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={submitting || seeding || !text.trim()}
          className="type-ui rounded-lg bg-clay px-4 py-1.5 text-sm font-medium text-warm-white transition-colors hover:bg-clay-mid disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Send answer"}
        </button>

        <button
          type="button"
          onClick={turnIntoChapter}
          disabled={submitting || seeding}
          className="type-ui rounded-lg border border-clay px-4 py-1.5 text-sm font-medium text-clay transition-colors hover:bg-clay hover:text-warm-white disabled:opacity-50"
        >
          {seeding ? "Starting chat…" : "Turn into a chapter →"}
        </button>
      </div>

      {error && (
        <p className="type-ui mt-2 text-xs text-red-800">{error}</p>
      )}
    </div>
  );
}

export function BeyondQAMode() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/beyond/questions");
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { questions: Question[] };
      setQuestions(data.questions);
    } catch {
      setError("Could not load questions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function markAnswered(id: string) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, _answered: true } : q))
    );
    setExpanded(null);
    // After a short delay, remove from list
    setTimeout(() => {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    }, 1200);
  }

  const pending = questions.filter((q) => !q._answered);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="type-display text-xl font-semibold text-ink">
            Reader questions
          </h2>
          <p className="type-ui text-sm text-ink-muted">
            Questions from family waiting for your answer.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="type-ui text-xs text-ink-ghost transition-colors hover:text-clay"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <p className="type-ui text-sm text-ink-ghost">Loading…</p>
      )}
      {error && (
        <p className="type-ui text-sm text-red-800">{error}</p>
      )}

      {!loading && pending.length === 0 && (
        <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-warm-white p-6 text-center">
          <p className="type-ui text-sm text-ink-muted">
            All caught up — no pending questions right now.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {pending.map((q) => {
          const isOpen = expanded === q.id;
          const isJustAnswered = q._answered;

          return (
            <li
              key={q.id}
              className={`rounded-lg border border-[var(--color-border)] bg-warm-white p-4 transition-opacity ${
                isJustAnswered ? "opacity-40" : ""
              }`}
            >
              {/* Header row */}
              <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <Link
                  href={`/stories/${q.story_id}`}
                  target="_blank"
                  className="type-ui rounded bg-warm-white-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-muted hover:text-clay"
                >
                  {q.story_id}
                </Link>
                {q.category && (
                  <span className="type-ui text-xs text-ink-ghost">
                    {CATEGORY_LABEL[q.category] ?? q.category}
                  </span>
                )}
                <span className="type-ui ml-auto text-[11px] text-ink-ghost">
                  {new Date(q.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Question */}
              <p className="mb-3 font-[family-name:var(--font-lora)] text-base italic leading-relaxed text-ink">
                &ldquo;{q.question}&rdquo;
              </p>

              {isJustAnswered ? (
                <p className="type-ui text-xs text-clay">Answer sent ✓</p>
              ) : (
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : q.id)}
                  className="type-ui text-xs text-ink-muted transition-colors hover:text-clay"
                >
                  {isOpen ? "Collapse" : "Answer"}
                </button>
              )}

              {isOpen && !isJustAnswered && (
                <AnswerPanel
                  question={q}
                  onAnswered={() => markAnswered(q.id)}
                  onTurnIntoChapter={() => router.push("/beyond")}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
