"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApproveButton({
  userId,
  label,
}: {
  userId: string;
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function approve() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/members/${userId}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Could not approve this account.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Could not approve this account.");
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error && <span className="type-meta text-red-700">{error}</span>}
      <button
        type="button"
        onClick={approve}
        disabled={busy}
        aria-label={`Approve ${label}`}
        className="type-ui rounded-full border border-[var(--color-border)] px-4 py-1.5 text-xs font-semibold text-green transition-colors hover:text-green/70 disabled:opacity-40"
      >
        {busy ? "Approving…" : "Approve"}
      </button>
    </div>
  );
}
