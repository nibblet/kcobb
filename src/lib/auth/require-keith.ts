import { createClient } from "@/lib/supabase/server";
import { hasKeithSpecialAccess } from "@/lib/auth/special-access";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export interface KeithGate {
  supabase: SupabaseClient;
  user: User | null;
  role: string | null;
  ok: boolean;
  status: number;
  error: "Unauthorized" | "Forbidden" | null;
}

/**
 * Shared auth gate for Beyond/People write routes. Returns the Supabase
 * client, authed user, and whether they have Keith-special-access (role
 * 'keith' | 'admin' via hasKeithSpecialAccess, or the email allowlist).
 */
export async function requireKeith(): Promise<KeithGate> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      role: null,
      ok: false,
      status: 401,
      error: "Unauthorized",
    };
  }

  const { data: profile } = await supabase
    .from("sb_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? null;
  const allowed =
    hasKeithSpecialAccess(user.email, role) || role === "admin";

  if (!allowed) {
    return { supabase, user, role, ok: false, status: 403, error: "Forbidden" };
  }
  return { supabase, user, role, ok: true, status: 200, error: null };
}
