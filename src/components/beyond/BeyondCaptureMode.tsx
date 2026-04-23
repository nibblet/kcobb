"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Era = "childhood" | "youth" | "military" | "career" | "family" | "later";

const ERAS: Era[] = ["childhood", "youth", "military", "career", "family", "later"];

interface Snippet {
  id: string;
  slug: string;
  text: string;
  themes: string[];
  people: string[];
  era: Era | null;
  expandable: boolean;
  source: string;
  created_at: string;
}

interface SlugCatalog {
  themes: string[];
  people: string[];
}

export function BeyondCaptureMode() {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<SlugCatalog>({ themes: [], people: [] });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        fetch("/api/snippets"),
        fetch("/api/snippets/slugs"),
      ]);
      if (sRes.ok) {
        const d = (await sRes.json()) as { snippets: Snippet[] };
        setSnippets(d.snippets);
      }
      if (cRes.ok) {
        const d = (await cRes.json()) as SlugCatalog;
        setCatalog(d);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!text.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), autoTag: true }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? "Failed");
      }
      const d = (await res.json()) as { snippet: Snippet };
      setSnippets((prev) => [d.snippet, ...prev]);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function patchInPlace(updated: Snippet) {
    setSnippets((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  function removeInPlace(id: string) {
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4">
        <h2 className="type-display text-xl font-semibold text-ink">
          Capture a memory
        </h2>
        <p className="type-ui text-sm text-ink-muted">
          Jot down a fact, detail, or memory. AI will tag it so it can enrich
          your stories later. Private — only you can see these.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-[var(--color-border)] bg-warm-white p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="My favorite song was 'By the Light of the Silvery Moon'…"
          rows={3}
          className="type-ui w-full resize-y rounded-lg border border-[var(--color-border)] bg-warm-white-2 px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-ink-ghost"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="type-ui text-xs text-ink-ghost">
            {text.trim().length} chars
          </span>
          <button
            type="button"
            onClick={save}
            disabled={saving || !text.trim()}
            className="type-ui rounded-lg bg-clay px-4 py-1.5 text-sm font-medium text-warm-white transition-colors hover:bg-clay-mid disabled:opacity-50"
          >
            {saving ? "Saving & tagging…" : "Save snippet"}
          </button>
        </div>
        {error && (
          <p className="type-ui mt-2 text-xs text-red-800">{error}</p>
        )}
      </div>

      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="type-display text-base font-semibold text-ink">
          Recent snippets
        </h3>
        <span className="type-ui text-xs text-ink-ghost">
          {snippets.length} total
        </span>
      </div>

      {loading && (
        <p className="type-ui text-sm text-ink-ghost">Loading…</p>
      )}

      {!loading && snippets.length === 0 && (
        <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-warm-white p-6 text-center">
          <p className="type-ui text-sm text-ink-muted">
            No snippets yet — capture your first one above.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {snippets.map((s) => (
          <SnippetCard
            key={s.id}
            snippet={s}
            catalog={catalog}
            onChange={patchInPlace}
            onDelete={() => removeInPlace(s.id)}
          />
        ))}
      </ul>
    </div>
  );
}

function SnippetCard({
  snippet,
  catalog,
  onChange,
  onDelete,
}: {
  snippet: Snippet;
  catalog: SlugCatalog;
  onChange: (s: Snippet) => void;
  onDelete: () => void;
}) {
  const [editingTags, setEditingTags] = useState(false);
  const [busy, setBusy] = useState(false);

  const themeOptions = useMemo(
    () => catalog.themes.filter((t) => !snippet.themes.includes(t)),
    [catalog.themes, snippet.themes]
  );
  const peopleOptions = useMemo(
    () => catalog.people.filter((p) => !snippet.people.includes(p)),
    [catalog.people, snippet.people]
  );

  async function patch(body: Partial<Snippet>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/snippets/${snippet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const d = (await res.json()) as { snippet: Snippet };
        onChange(d.snippet);
      }
    } finally {
      setBusy(false);
    }
  }

  async function destroy() {
    if (!confirm("Delete this snippet?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/snippets/${snippet.id}`, {
        method: "DELETE",
      });
      if (res.ok) onDelete();
    } finally {
      setBusy(false);
    }
  }

  function removeTheme(t: string) {
    patch({ themes: snippet.themes.filter((x) => x !== t) });
  }
  function addTheme(t: string) {
    patch({ themes: [...snippet.themes, t] });
  }
  function removePerson(p: string) {
    patch({ people: snippet.people.filter((x) => x !== p) });
  }
  function addPerson(p: string) {
    patch({ people: [...snippet.people, p] });
  }
  function setEra(era: Era | null) {
    patch({ era });
  }

  return (
    <li className="rounded-lg border border-[var(--color-border)] bg-warm-white p-4">
      <p className="font-[family-name:var(--font-lora)] text-base leading-relaxed text-ink">
        {snippet.text}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {snippet.themes.map((t) => (
          <button
            key={`t-${t}`}
            type="button"
            onClick={() => editingTags && removeTheme(t)}
            disabled={busy}
            title={editingTags ? "Click to remove" : t}
            className={`type-ui rounded-full px-2 py-0.5 text-[11px] font-medium ${
              editingTags
                ? "bg-clay/15 text-clay hover:bg-red-100 hover:text-red-800"
                : "bg-clay/10 text-clay"
            }`}
          >
            #{t}
            {editingTags && <span className="ml-1">×</span>}
          </button>
        ))}
        {snippet.people.map((p) => (
          <button
            key={`p-${p}`}
            type="button"
            onClick={() => editingTags && removePerson(p)}
            disabled={busy}
            title={editingTags ? "Click to remove" : p}
            className={`type-ui rounded-full px-2 py-0.5 text-[11px] font-medium ${
              editingTags
                ? "bg-warm-white-2 text-ink-muted hover:bg-red-100 hover:text-red-800"
                : "bg-warm-white-2 text-ink-muted"
            }`}
          >
            @{p}
            {editingTags && <span className="ml-1">×</span>}
          </button>
        ))}
        {snippet.era && (
          <span className="type-ui rounded-full bg-warm-white-2 px-2 py-0.5 text-[11px] font-medium text-ink-ghost">
            {snippet.era}
          </span>
        )}
        {snippet.themes.length === 0 &&
          snippet.people.length === 0 &&
          !snippet.era && (
            <span className="type-ui text-[11px] italic text-ink-ghost">
              no tags
            </span>
          )}
      </div>

      {editingTags && (
        <div className="mt-3 space-y-2 border-t border-[var(--color-border)] pt-3">
          <div>
            <label className="type-ui mb-1 block text-[11px] font-medium text-ink-ghost">
              Add theme
            </label>
            <select
              value=""
              onChange={(e) => e.target.value && addTheme(e.target.value)}
              disabled={busy}
              className="type-ui w-full rounded border border-[var(--color-border)] bg-warm-white-2 px-2 py-1 text-xs"
            >
              <option value="">— pick a theme —</option>
              {themeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="type-ui mb-1 block text-[11px] font-medium text-ink-ghost">
              Add person
            </label>
            <select
              value=""
              onChange={(e) => e.target.value && addPerson(e.target.value)}
              disabled={busy}
              className="type-ui w-full rounded border border-[var(--color-border)] bg-warm-white-2 px-2 py-1 text-xs"
            >
              <option value="">— pick a person —</option>
              {peopleOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="type-ui mb-1 block text-[11px] font-medium text-ink-ghost">
              Era
            </label>
            <select
              value={snippet.era ?? ""}
              onChange={(e) =>
                setEra((e.target.value || null) as Era | null)
              }
              disabled={busy}
              className="type-ui w-full rounded border border-[var(--color-border)] bg-warm-white-2 px-2 py-1 text-xs"
            >
              <option value="">— none —</option>
              {ERAS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="type-ui text-ink-ghost">
          {new Date(snippet.created_at).toLocaleDateString()}
        </span>
        <div className="flex gap-3">
          <Link
            href={`/beyond?mode=write&fromSnippet=${snippet.id}`}
            className="type-ui text-clay transition-colors hover:text-clay-mid"
          >
            ✨ Write more →
          </Link>
          <button
            type="button"
            onClick={() => setEditingTags((v) => !v)}
            disabled={busy}
            className="type-ui text-ink-muted transition-colors hover:text-clay"
          >
            {editingTags ? "Done" : "Edit tags"}
          </button>
          <button
            type="button"
            onClick={destroy}
            disabled={busy}
            className="type-ui text-ink-ghost transition-colors hover:text-red-800"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
