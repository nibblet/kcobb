"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Only allow same-origin relative paths (avoid open redirects). */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Completing sign-in…");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const next = safeNext(url.searchParams.get("next"));

      const oauthError = url.searchParams.get("error");
      const oauthDesc = url.searchParams.get("error_description");
      if (oauthError) {
        const msg = oauthDesc || oauthError;
        window.location.replace(
          `/login?error=auth&message=${encodeURIComponent(msg)}`
        );
        return;
      }

      const code = url.searchParams.get("code");
      if (code) {
        setStatus("Verifying your session…");
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
          window.location.replace("/login?error=auth");
          return;
        }
        window.location.replace(next);
        return;
      }

      const tokenHash = url.searchParams.get("token_hash");
      const otpType = url.searchParams.get("type");
      if (tokenHash && otpType) {
        setStatus("Verifying your session…");
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: otpType as "recovery" | "signup" | "email_change" | "invite",
        });
        if (cancelled) return;
        if (error) {
          window.location.replace("/login?error=auth");
          return;
        }
        window.location.replace(next);
        return;
      }

      const hash = url.hash.replace(/^#/, "");
      if (hash) {
        const hp = new URLSearchParams(hash);
        const access_token = hp.get("access_token");
        const refresh_token = hp.get("refresh_token");
        if (access_token && refresh_token) {
          setStatus("Verifying your session…");
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (cancelled) return;
          if (error) {
            window.location.replace("/login?error=auth");
            return;
          }
          window.history.replaceState(
            {},
            "",
            url.pathname + url.search
          );
          window.location.replace(next);
          return;
        }
      }

      window.location.replace("/login?error=auth");
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-parchment px-4">
      <p className="type-ui text-ink-muted">{status}</p>
    </div>
  );
}
