/**
 * Origin used in auth email redirects (e.g. signUp emailRedirectTo).
 * When NEXT_PUBLIC_SITE_URL is set (recommended on Vercel), it wins so
 * confirmation links match production even if other URL config drifts.
 */
export function getAuthRedirectOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim();
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
