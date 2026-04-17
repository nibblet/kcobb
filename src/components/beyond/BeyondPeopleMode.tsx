"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface PersonListItem {
  id: string;
  slug: string;
  display_name: string;
  relationship: string | null;
  birth_year: number | null;
  death_year: number | null;
  bio_md: string | null;
}

interface PersonDetail extends PersonListItem {
  aiDraft: string | null;
}

type SaveState = "idle" | "saving" | "saved" | "error";

function PersonEditor({
  person,
  onSaved,
  onClose,
}: {
  person: PersonDetail;
  onSaved: (updated: PersonListItem) => void;
  onClose: () => void;
}) {
  const [displayName, setDisplayName] = useState(person.display_name);
  const [relationship, setRelationship] = useState(person.relationship ?? "");
  const [bio, setBio] = useState(person.bio_md ?? person.aiDraft ?? "");
  const [birthYear, setBirthYear] = useState(
    person.birth_year ? String(person.birth_year) : ""
  );
  const [deathYear, setDeathYear] = useState(
    person.death_year ? String(person.death_year) : ""
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const isAiPrefill = !person.bio_md && !!person.aiDraft;

  async function save() {
    setSaveState("saving");
    try {
      const res = await fetch(`/api/people/${person.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          relationship: relationship.trim() || null,
          bio_md: bio || null,
          birth_year: birthYear ? Number(birthYear) : null,
          death_year: deathYear ? Number(deathYear) : null,
        }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { person: PersonListItem };
      setSaveState("saved");
      onSaved(data.person);
      setTimeout(() => setSaveState("idle"), 1500);
    } catch {
      setSaveState("error");
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-clay-border bg-warm-white-2 p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="type-ui col-span-2 flex flex-col gap-1 text-xs text-ink-muted">
          Name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded border border-[var(--color-border)] bg-warm-white px-2 py-1.5 text-sm text-ink"
          />
        </label>
        <label className="type-ui col-span-2 flex flex-col gap-1 text-xs text-ink-muted">
          Relationship
          <input
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="father, mentor, friend…"
            className="rounded border border-[var(--color-border)] bg-warm-white px-2 py-1.5 text-sm text-ink"
          />
        </label>
        <label className="type-ui flex flex-col gap-1 text-xs text-ink-muted">
          Born
          <input
            type="number"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            className="rounded border border-[var(--color-border)] bg-warm-white px-2 py-1.5 text-sm text-ink"
          />
        </label>
        <label className="type-ui flex flex-col gap-1 text-xs text-ink-muted">
          Died
          <input
            type="number"
            value={deathYear}
            onChange={(e) => setDeathYear(e.target.value)}
            className="rounded border border-[var(--color-border)] bg-warm-white px-2 py-1.5 text-sm text-ink"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="type-ui text-xs text-ink-muted">Bio</span>
          {isAiPrefill && (
            <span className="type-ui text-[10px] text-clay">
              AI draft · edit freely
            </span>
          )}
        </div>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={12}
          className="w-full rounded border border-[var(--color-border)] bg-warm-white px-2 py-2 font-serif text-sm leading-relaxed text-ink"
        />
      </div>

      {saveState === "error" && (
        <p className="type-ui mt-2 text-xs text-red-800">Save failed — try again.</p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={saveState === "saving"}
          className="type-ui flex-1 rounded border border-[var(--color-border)] bg-warm-white px-3 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saveState === "saving"}
          className="type-ui flex-1 rounded bg-clay px-3 py-1.5 text-sm font-medium text-warm-white transition-colors hover:bg-clay-mid disabled:opacity-50"
        >
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : "Save"}
        </button>
      </div>
    </div>
  );
}

export function BeyondPeopleMode() {
  const [people, setPeople] = useState<PersonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<PersonDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/people?limit=50");
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { people: PersonListItem[] };
      setPeople(data.people);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function expand(person: PersonListItem) {
    if (expandedSlug === person.slug) {
      setExpandedSlug(null);
      setExpandedDetail(null);
      return;
    }
    setExpandedSlug(person.slug);
    setExpandedDetail(null);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/people/${person.slug}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { person: PersonListItem; aiDraft: string | null };
      setExpandedDetail({ ...data.person, aiDraft: data.aiDraft });
    } finally {
      setLoadingDetail(false);
    }
  }

  function handleSaved(updated: PersonListItem) {
    setPeople((prev) =>
      prev.map((p) => (p.slug === updated.slug ? { ...p, ...updated } : p))
    );
    if (expandedDetail?.slug === updated.slug) {
      setExpandedDetail((d) => d ? { ...d, ...updated } : d);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) =>
        p.display_name.toLowerCase().includes(q) ||
        (p.relationship ?? "").toLowerCase().includes(q)
    );
  }, [query, people]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4">
        <h2 className="type-display text-xl font-semibold text-ink">People</h2>
        <p className="type-ui text-sm text-ink-muted">
          Edit bios and details for the people in the memoir.
        </p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or relationship…"
        className="type-ui mb-4 w-full rounded-lg border border-[var(--color-border)] bg-warm-white px-3 py-2 text-sm text-ink placeholder:text-ink-ghost"
      />

      {loading && (
        <p className="type-ui text-sm text-ink-ghost">Loading…</p>
      )}

      {!loading && filtered.length === 0 && (
        <p className="type-ui text-sm text-ink-ghost">No matches.</p>
      )}

      <ul className="space-y-2">
        {filtered.map((p) => {
          const isOpen = expandedSlug === p.slug;
          return (
            <li key={p.slug}>
              <button
                type="button"
                onClick={() => expand(p)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
                  isOpen
                    ? "border-clay-border bg-warm-white"
                    : "border-[var(--color-border)] bg-warm-white hover:border-clay-border"
                }`}
              >
                <div className="min-w-0">
                  <span className="type-ui block font-medium text-ink">
                    {p.display_name}
                  </span>
                  {p.relationship && (
                    <span className="type-ui text-xs text-ink-muted">
                      {p.relationship}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {p.bio_md && (
                    <span className="type-ui rounded-full bg-clay/10 px-2 py-0.5 text-[10px] text-clay">
                      edited
                    </span>
                  )}
                  <span className="type-ui text-xs text-ink-ghost">
                    {isOpen ? "▲" : "▼"}
                  </span>
                </div>
              </button>

              {isOpen && (
                loadingDetail ? (
                  <p className="type-ui mt-2 px-1 text-xs text-ink-ghost">Loading…</p>
                ) : expandedDetail ? (
                  <PersonEditor
                    person={expandedDetail}
                    onSaved={handleSaved}
                    onClose={() => { setExpandedSlug(null); setExpandedDetail(null); }}
                  />
                ) : null
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
