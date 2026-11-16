/**
 * Approval gate helpers shared by the proxy, the pending page and the
 * approval API.
 *
 * The Supabase project is shared with other apps, so a valid session only
 * proves someone has an account somewhere — not that they are family. Access
 * to this app is decided by `sb_profiles.role`: new rows start as 'pending'
 * (migration 024) and only the roles below are let in.
 */

export const APPROVED_ROLES = ["member", "keith", "admin"] as const;
export const APPROVER_ROLES = ["keith", "admin"] as const;

export const PENDING_ROLE = "pending";
export const PENDING_PATH = "/pending";

/** True when the role may use the app. A missing profile row is not approved. */
export function isApprovedRole(role: string | null | undefined): boolean {
  return (APPROVED_ROLES as readonly string[]).includes(role ?? "");
}

/** True when the role may approve pending accounts. */
export function canApproveMembers(role: string | null | undefined): boolean {
  return (APPROVER_ROLES as readonly string[]).includes(role ?? "");
}

function isAtOrUnder(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * Paths a signed-in but unapproved user may still reach: the auth flow and
 * framework assets. Matches whole path segments, so "/authors" is not treated
 * as "/auth".
 */
export function isApprovalOpenPath(pathname: string): boolean {
  return (
    isAtOrUnder(pathname, "/login") ||
    isAtOrUnder(pathname, "/signup") ||
    isAtOrUnder(pathname, "/forgot-password") ||
    isAtOrUnder(pathname, "/update-password") ||
    isAtOrUnder(pathname, "/auth") ||
    isAtOrUnder(pathname, "/_next") ||
    pathname === "/favicon.ico"
  );
}

export type ApprovalDecision =
  | "allow"
  | "redirect-pending"
  | "forbid-api"
  | "redirect-home";

/**
 * What the proxy should do with a request from a signed-in user whose
 * profile role is `role` (null when there is no profile row or the lookup
 * failed — both are treated as not approved).
 */
export function approvalDecision(
  pathname: string,
  role: string | null | undefined
): ApprovalDecision {
  if (isApprovalOpenPath(pathname)) return "allow";

  const onPendingPage = isAtOrUnder(pathname, PENDING_PATH);

  if (isApprovedRole(role)) {
    return onPendingPage ? "redirect-home" : "allow";
  }

  if (onPendingPage) return "allow";
  if (isAtOrUnder(pathname, "/api")) return "forbid-api";
  return "redirect-pending";
}
