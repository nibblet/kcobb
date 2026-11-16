"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function PendingSignOutButton() {
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    if (busy) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={busy}
      className="type-ui inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--color-border)] px-6 py-2 text-sm font-semibold text-ink transition-colors hover:text-burgundy disabled:opacity-40"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
