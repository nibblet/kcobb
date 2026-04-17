"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Editor } from "@tiptap/react";
import { TipTapEditor, type MentionEntry } from "./TipTapEditor";
import { MediaGallery } from "./MediaGallery";

export interface DraftRecord {
  id: string;
  title: string;
  body: string;
  life_stage: string | null;
  year_start: number | null;
  year_end: number | null;
  themes: string[] | null;
  principles: string[] | null;
  quotes: string[] | null;
  status: "draft" | "approved" | "published";
  origin?: "chat" | "write" | "edit";
  story_id?: string | null;
  updated_at?: string;
}

interface Props {
  initial?: DraftRecord | null;
  origin: "write" | "edit";
  onSaved?: (draft: DraftRecord) => void;
  onBack?: () => void;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function BeyondDraftEditor({ initial, origin, onSaved, onBack }: Props) {
  const [draftId, setDraftId] = useState<string | null>(initial?.id ?? null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [mentions, setMentions] = useState<MentionEntry[]>([]);
  const [lifeStage, setLifeStage] = useState(initial?.life_stage ?? "");
  const [yearStart, setYearStart] = useState<string>(
    initial?.year_start ? String(initial.year_start) : ""
  );
  const [yearEnd, setYearEnd] = useState<string>(
    initial?.year_end ? String(initial.year_end) : ""
  );
  const [themes, setThemes] = useState((initial?.themes ?? []).join(", "));
  const [principles, setPrinciples] = useState(
    (initial?.principles ?? []).join(", ")
  );
  const [quotes, setQuotes] = useState((initial?.quotes ?? []).join("\n"));
  const [showPreview, setShowPreview] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(
    initial?.updated_at ? new Date(initial.updated_at) : null
  );
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "submitted">(
    initial?.status && initial.status !== "draft" ? "submitted" : "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedPayload = useRef<string>("");
  const editorRef = useRef<Editor | null>(null);

  const payload = useMemo(() => {
    const split = (s: string) =>
      s
        .split(/[,\n]/)
        .map((v) => v.trim())
        .filter(Boolean);
    return {
      title,
      body,
      life_stage: lifeStage.trim() || null,
      year_start: yearStart ? Number(yearStart) : null,
      year_end: yearEnd ? Number(yearEnd) : null,
      themes: split(themes),
      principles: split(principles),
      quotes: quotes
        .split("\n")
        .map((q) => q.trim())
        .filter(Boolean),
      mentions: mentions
        .filter((m) => m.id && m.id !== "__new__")
        .map((m) => ({ id: m.id })),
    };
  }, [title, body, lifeStage, yearStart, yearEnd, themes, principles, quotes, mentions]);

  const save = useCallback(async () => {
    const serialized = JSON.stringify(payload);
    if (serialized === lastSavedPayload.current) return;
    if (!payload.title.trim() && !payload.body.trim()) return;

    setSaveState("saving");
    setError(null);
    try {
      if (!draftId) {
        const res = await fetch("/api/beyond/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, origin }),
        });
        if (!res.ok) throw new Error("create failed");
        const data = (await res.json()) as { draft: DraftRecord };
        setDraftId(data.draft.id);
        lastSavedPayload.current = serialized;
        setSavedAt(new Date());
        setSaveState("saved");
        onSaved?.(data.draft);
      } else {
        const res = await fetch(`/api/beyond/drafts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("update failed");
        const data = (await res.json()) as { draft: DraftRecord };
        lastSavedPayload.current = serialized;
        setSavedAt(new Date());
        setSaveState("saved");
        onSaved?.(data.draft);
      }
    } catch (err) {
      setSaveState("error");
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }, [draftId, origin, payload, onSaved]);

  // Debounced autosave.
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      save();
    }, 2500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [save]);

  async function submitForReview() {
    if (!draftId) {
      await save();
    }
    const id = draftId;
    if (!id) return;
    setSubmitState("submitting");
    try {
      const res = await fetch(`/api/beyond/drafts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, status: "approved" }),
      });
      if (!res.ok) throw new Error("submit failed");
      setSubmitState("submitted");
    } catch {
      setSubmitState("idle");
      setError("Could not submit — try again.");
    }
  }

  const savedLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "error"
        ? "Save failed"
        : savedAt
          ? `Saved ${formatRelative(savedAt)}`
          : "Not saved yet";

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4 px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="type-ui mb-1 text-xs text-ink-ghost transition-colors hover:text-clay"
            >
              ← Back to drafts
            </button>
          )}
          <p className="type-ui text-xs uppercase tracking-wide text-ink-ghost">
            {origin === "edit" ? "Revise" : "New story"} · {savedLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            className="type-ui rounded-lg border border-[var(--color-border)] bg-warm-white px-3 py-1.5 text-sm text-ink-muted transition-colors hover:text-clay"
          >
            {showPreview ? "Edit" : "Preview"}
          </button>
          <button
            type="button"
            onClick={submitForReview}
            disabled={submitState !== "idle" || !payload.title.trim()}
            className="type-ui rounded-lg bg-clay px-3 py-1.5 text-sm font-medium text-warm-white transition-colors hover:bg-clay-mid disabled:opacity-50"
          >
            {submitState === "submitted"
              ? "Submitted"
              : submitState === "submitting"
                ? "Submitting…"
                : "Submit for review"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {showPreview ? (
        <div className="flex-1 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-warm-white-2 p-6">
          <h1 className="mb-4 text-2xl font-semibold text-ink">
            {title || "Untitled"}
          </h1>
          <div className="prose prose-story max-w-none">
            {isHTML(body) ? (
              <div dangerouslySetInnerHTML={{ __html: body }} />
            ) : (
              <ReactMarkdown>
                {body || "_Nothing yet — switch to Edit and start writing._"}
              </ReactMarkdown>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Story title"
            className="type-ui rounded-lg border border-[var(--color-border)] bg-warm-white px-3 py-2 text-lg font-semibold text-ink placeholder:text-ink-ghost"
          />
          <TipTapEditor
            initialHTML={initial?.body ?? ""}
            placeholder="Write the story. Use @ to reference a person."
            onChange={(html, ms) => {
              setBody(html);
              setMentions(ms);
            }}
            onReady={(ed) => {
              editorRef.current = ed;
            }}
          />
          <div>
            <p className="type-ui mb-1 text-xs font-medium uppercase tracking-wide text-ink-ghost">
              Photos
            </p>
            <MediaGallery
              ownerType="story"
              ownerId={draftId}
              canEdit={true}
              onInsertIntoEditor={(item) => {
                const ed = editorRef.current;
                if (!ed) return;
                ed.chain()
                  .focus()
                  .setImage({
                    src: item.display_url,
                    alt: item.caption ?? "",
                  })
                  .run();
              }}
            />
          </div>
          <details className="rounded-lg border border-[var(--color-border)] bg-warm-white px-3 py-2">
            <summary className="type-ui cursor-pointer text-sm font-medium text-ink">
              Metadata
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="type-ui flex flex-col gap-1 text-xs text-ink-muted">
                Life stage
                <input
                  value={lifeStage}
                  onChange={(e) => setLifeStage(e.target.value)}
                  placeholder="e.g. childhood, early career"
                  className="rounded border border-[var(--color-border)] bg-warm-white-2 px-2 py-1 text-sm text-ink"
                />
              </label>
              <div className="flex gap-2">
                <label className="type-ui flex flex-1 flex-col gap-1 text-xs text-ink-muted">
                  Year start
                  <input
                    type="number"
                    value={yearStart}
                    onChange={(e) => setYearStart(e.target.value)}
                    className="rounded border border-[var(--color-border)] bg-warm-white-2 px-2 py-1 text-sm text-ink"
                  />
                </label>
                <label className="type-ui flex flex-1 flex-col gap-1 text-xs text-ink-muted">
                  Year end
                  <input
                    type="number"
                    value={yearEnd}
                    onChange={(e) => setYearEnd(e.target.value)}
                    className="rounded border border-[var(--color-border)] bg-warm-white-2 px-2 py-1 text-sm text-ink"
                  />
                </label>
              </div>
              <label className="type-ui flex flex-col gap-1 text-xs text-ink-muted sm:col-span-2">
                Themes (comma-separated)
                <input
                  value={themes}
                  onChange={(e) => setThemes(e.target.value)}
                  className="rounded border border-[var(--color-border)] bg-warm-white-2 px-2 py-1 text-sm text-ink"
                />
              </label>
              <label className="type-ui flex flex-col gap-1 text-xs text-ink-muted sm:col-span-2">
                Principles (comma-separated)
                <input
                  value={principles}
                  onChange={(e) => setPrinciples(e.target.value)}
                  className="rounded border border-[var(--color-border)] bg-warm-white-2 px-2 py-1 text-sm text-ink"
                />
              </label>
              <label className="type-ui flex flex-col gap-1 text-xs text-ink-muted sm:col-span-2">
                Quotes (one per line)
                <textarea
                  value={quotes}
                  onChange={(e) => setQuotes(e.target.value)}
                  rows={3}
                  className="rounded border border-[var(--color-border)] bg-warm-white-2 px-2 py-1 text-sm text-ink"
                />
              </label>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

function isHTML(s: string): boolean {
  return /^\s*</.test(s);
}

function formatRelative(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 5) return "just now";
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
