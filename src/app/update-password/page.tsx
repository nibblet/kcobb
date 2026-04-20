"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="type-page-title text-3xl">The Cobb Family</h1>
          <h2 className="type-page-title mt-1 text-3xl">Story Library</h2>
          <p className="type-ui mt-3 text-ink-muted">Choose a new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="new-password"
              className="type-ui mb-1 block text-ink"
            >
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="type-ui w-full rounded-lg border border-[var(--color-border)] bg-warm-white px-3 py-2 text-ink"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="type-ui mb-1 block text-ink"
            >
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="type-ui w-full rounded-lg border border-[var(--color-border)] bg-warm-white px-3 py-2 text-ink"
              placeholder="Repeat your new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="type-ui w-full rounded-lg bg-clay py-2.5 font-medium text-warm-white transition-colors hover:bg-clay-mid disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save new password"}
          </button>

          <p className="type-ui text-center text-sm text-ink-muted">
            <Link
              href="/login"
              className="text-burgundy underline-offset-2 hover:underline"
              prefetch={false}
            >
              Cancel and sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
