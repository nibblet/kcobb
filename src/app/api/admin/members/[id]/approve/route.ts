import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PENDING_ROLE,
  canApproveMembers,
} from "@/lib/auth/approval";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/admin/members/:id/approve
 *
 * Moves a pending account to 'member'. Caller must be 'admin' or 'keith'.
 * The write goes through the service-role client: RLS only lets users touch
 * their own profile row, and the sb_profiles_guard_role trigger rejects role
 * changes made with a user key.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: caller } = await supabase
    .from("sb_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!canApproveMembers(caller?.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!UUID_RE.test(id)) {
    return Response.json({ error: "Invalid account id" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("sb_profiles")
    .update({ role: "member", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("role", PENDING_ROLE)
    .select("id");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!updated || updated.length === 0) {
    return Response.json(
      { error: "No pending account with that id" },
      { status: 404 }
    );
  }

  return Response.json({ ok: true });
}
