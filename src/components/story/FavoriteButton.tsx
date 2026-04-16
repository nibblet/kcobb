"use client";

import { useState } from "react";

interface FavoriteButtonProps {
  storyId: string;
  storyTitle: string;
  initialFavorited: boolean;
}

export function FavoriteButton({
  storyId,
  storyTitle,
  initialFavorited,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setFavorited((prev) => !prev);
    setBusy(true);

    try {
      const res = await fetch(`/api/stories/${storyId}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: favorited ? "remove" : "add",
          story_title: storyTitle,
        }),
      });
      if (!res.ok) {
        setFavorited((prev) => !prev);
      }
    } catch {
      setFavorited((prev) => !prev);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={favorited ? "Remove from favorites" : "Save as favorite"}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-warm-white px-3 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:border-clay-border hover:text-clay disabled:opacity-50"
    >
      <span aria-hidden className="text-base leading-none">
        {favorited ? "\u2665" : "\u2661"}
      </span>
    </button>
  );
}
