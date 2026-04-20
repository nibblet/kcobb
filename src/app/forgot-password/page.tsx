"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAuthRedirectOrigin } from "@/lib/app-url";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const origin = getAuthRedirectOrigin();
    if (!origin) {
      setError("Site URL is not configured. Set NEXT_PUBLIC_SITE_URL.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/update-password")}`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo }
    );

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="type-page-title text-3xl">The Cobb Family</h1>
          <h2 className="type-page-title mt-1 text-3xl">Story Library</h2>
          <p className="type-ui mt-3 text-ink-muted">Reset your password</p>
        </div>

        {sent ? (
          <div className="space-y-4 rounded-lg border border-[var(--color-border)] bg-warm-white p-6 text-center">
            <p className="type-ui text-ink">
              If an account exists for that email, you&apos;ll receive a link to
              choose a new password. Check your inbox and spam folder.
            </p>
            <Link
              href="/login"
              className="type-ui inline-block text-burgundy underline-offset-2 hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="type-ui mb-1 block text-ink"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="type-ui w-full rounded-lg border border-[var(--color-border)] bg-warm-white px-3 py-2 text-ink"
                placeholder="you@family.com"
              />
              <p className="type-ui mt-2 text-xs text-ink-muted">
                We&apos;ll send a secure link if this address is registered.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="type-ui w-full rounded-lg bg-clay py-2.5 font-medium text-warm-white transition-colors hover:bg-clay-mid disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>

            <p className="type-ui text-center text-sm text-ink-muted">
              <Link
                href="/login"
                className="text-burgundy underline-offset-2 hover:underline"
              >
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
