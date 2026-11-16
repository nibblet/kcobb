import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export interface SessionResult {
  /** Response carrying any refreshed auth cookies, or an auth redirect. */
  response: NextResponse;
  /** Request-scoped client, for follow-up queries as the signed-in user. */
  supabase: SupabaseClient | null;
  user: User | null;
}

export async function updateSession(
  request: NextRequest
): Promise<SessionResult> {
  const pkceUrl = request.nextUrl.clone();
  if (pkceUrl.pathname === "/" && pkceUrl.searchParams.has("code")) {
    pkceUrl.pathname = "/auth/callback";
    return {
      response: NextResponse.redirect(pkceUrl),
      supabase: null,
      user: null,
    };
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow access to login, signup, forgot-password, and auth callback without auth
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/forgot-password") ||
    request.nextUrl.pathname.startsWith("/auth");

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return { response: NextResponse.redirect(url), supabase, user };
  }

  // Redirect logged-in users away from login / signup / forgot-password
  if (
    user &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/signup" ||
      request.nextUrl.pathname === "/forgot-password")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return { response: NextResponse.redirect(url), supabase, user };
  }

  return { response: supabaseResponse, supabase, user };
}
