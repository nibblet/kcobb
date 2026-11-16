import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  ONBOARDED_COOKIE,
  ONBOARDED_COOKIE_MAX_AGE,
  isOnboardingAllowlisted,
} from "@/lib/auth/onboarding";
import {
  PENDING_PATH,
  approvalDecision,
  isApprovalOpenPath,
} from "@/lib/auth/approval";

/**
 * Carry any auth cookies refreshed during updateSession onto a response we
 * build ourselves, so a redirect / 403 doesn't drop a rotated session.
 */
function withSessionCookies<T extends NextResponse>(
  response: T,
  sessionResponse: NextResponse
): T {
  sessionResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });
  return response;
}

export async function proxy(request: NextRequest) {
  // 1. Run the existing Supabase session refresh + auth redirects. If this
  //    returns a redirect (e.g. unauthed user → /login, or logged-in user
  //    hitting /login → /), honor it and skip the gates below.
  const {
    response: sessionResponse,
    supabase,
    user,
  } = await updateSession(request);
  if (sessionResponse.status >= 300 && sessionResponse.status < 400) {
    return sessionResponse;
  }

  // 2. No user here means an auth route (updateSession redirects everything
  //    else to /login), so there is nothing to gate.
  if (!user || !supabase) {
    return sessionResponse;
  }

  const { pathname } = request.nextUrl;

  // 3. The auth flow and framework assets stay reachable for every signed-in
  //    user, approved or not. They are also onboarding-allowlisted, so we
  //    can return without a profile lookup.
  if (isApprovalOpenPath(pathname)) {
    return sessionResponse;
  }

  // 4. Approval gate. This Supabase project is shared with other apps, so a
  //    valid session alone doesn't mean "family". Look up the profile role
  //    on every gated request: unlike the onboarding flag, this decides who
  //    can read the site, so it is deliberately NOT cached in a cookie the
  //    browser could set for itself. A missing row or a failed lookup leaves
  //    role null, which is treated as not approved.
  const { data: profile } = await supabase
    .from("sb_profiles")
    .select("role, has_onboarded")
    .eq("id", user.id)
    .maybeSingle();

  const decision = approvalDecision(pathname, profile?.role ?? null);

  if (decision === "forbid-api") {
    return withSessionCookies(
      NextResponse.json(
        { error: "Your account is awaiting approval." },
        { status: 403 }
      ),
      sessionResponse
    );
  }

  if (decision === "redirect-pending" || decision === "redirect-home") {
    const url = request.nextUrl.clone();
    url.pathname = decision === "redirect-pending" ? PENDING_PATH : "/";
    url.search = "";
    return withSessionCookies(NextResponse.redirect(url), sessionResponse);
  }

  // An unapproved user allowed through is on the pending page; the
  // onboarding tour is not for them.
  if (pathname === PENDING_PATH || pathname.startsWith(`${PENDING_PATH}/`)) {
    return sessionResponse;
  }

  // 5. Onboarding gate (approved users only from here). Skip it for
  //    allowlisted paths (welcome, api) so we never redirect-loop or
  //    interrupt API calls.
  if (isOnboardingAllowlisted(pathname)) {
    return sessionResponse;
  }

  // 6. The sb_onboarded cookie is only a convenience signal for the tour —
  //    forging it skips the tour, nothing more — so it is still honored.
  if (request.cookies.get(ONBOARDED_COOKIE)?.value === "1") {
    return sessionResponse;
  }

  if (profile?.has_onboarded) {
    sessionResponse.cookies.set(ONBOARDED_COOKIE, "1", {
      path: "/",
      maxAge: ONBOARDED_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
    return sessionResponse;
  }

  // 7. Not onboarded — redirect to /welcome.
  const welcomeUrl = request.nextUrl.clone();
  welcomeUrl.pathname = "/welcome";
  welcomeUrl.search = "";
  return withSessionCookies(NextResponse.redirect(welcomeUrl), sessionResponse);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
