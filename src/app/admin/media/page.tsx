"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface AdminMediaRow {
  id: string;
  owner_type: "story" | "person";
  owner_id: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
  content_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  deleted_at: string | null;
  thumb_url: string;
  display_url: string;
}

export default function AdminMediaPage() {
  const [items, setItems] = useState<AdminMediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/media?include_deleted=${showDeleted}`
      );
      if (res.status === 403) {
        setError("Admin access required.");
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { media: AdminMediaRow[] };
      setItems(data.media);
      setError(null);
    } catch {
      setError("Failed to load media.");
    } finally {
      setLoading(false);
    }
  }, [showDeleted]);

  useEffect(() => {
    load();
  }, [load]);

  async function restore(row: AdminMediaRow) {
    setBusy(row.id);
    try {
      const res = await fetch(
        `/api/admin/media/${row.id}?action=restore`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setError("Restore failed.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-content px-[var(--page-padding-x)] py-8">
        <p className="text-sm text-ink-ghost">Loading media…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content px-[var(--page-padding-x)] py-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="type-page-title text-2xl">Media</h1>
          <p className="type-ui text-sm text-ink-muted">
            Recent photo uploads across stories and people.
          </p>
        </div>
        <label className="type-ui flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
          />
          Include deleted
        </label>
      </div>

      {error && <p className="mb-4 text-sm text-red-800">{error}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map((m) => {
          const ownerHref =
            m.owner_type === "person"
              ? null
              : `/stories/${m.owner_id}`;
          return (
            <figure
              key={m.id}
              className={`overflow-hidden rounded-lg border border-[var(--color-border)] bg-warm-white ${
                m.deleted_at ? "opacity-60" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.thumb_url}
                alt={m.caption ?? ""}
                className="h-40 w-full object-cover"
                loading="lazy"
              />
              <figcaption className="space-y-1 p-2">
                <p className="type-ui truncate text-xs font-medium text-ink">
                  {m.caption || <span className="text-ink-ghost">(no caption)</span>}
                </p>
                <p className="type-ui text-[10px] text-ink-ghost">
                  {m.owner_type} ·{" "}
                  {ownerHref ? (
                    <Link href={ownerHref} className="hover:text-clay">
                      {m.owner_id.slice(0, 8)}
                    </Link>
                  ) : (
                    m.owner_id.slice(0, 8)
                  )}
                  {" · "}
                  {new Date(m.created_at).toLocaleDateString()}
                </p>
                {m.deleted_at && (
                  <div className="flex items-center justify-between">
                    <span className="type-ui rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-800">
                      deleted
                    </span>
                    <button
                      type="button"
                      onClick={() => restore(m)}
                      disabled={busy === m.id}
                      className="type-ui rounded bg-clay px-2 py-0.5 text-[10px] font-medium text-warm-white hover:bg-clay-mid disabled:opacity-50"
                    >
                      {busy === m.id ? "…" : "Restore"}
                    </button>
                  </div>
                )}
              </figcaption>
            </figure>
          );
        })}
      </div>

      {items.length === 0 && !loading && (
        <p className="type-ui text-sm text-ink-ghost">No media yet.</p>
      )}
    </div>
  );
}
