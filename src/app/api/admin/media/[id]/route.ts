import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/media/[id]?action=restore
 *   — admin-only undelete (clears deleted_at). Uses the admin client to
 *   bypass the public-active-only SELECT policy.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("sb_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return Response.json({ error: "Admin required" }, { status: 403 });
  }

  if (action !== "restore") {
    return Response.json({ error: "Unknown action" }, { status: 400 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("sb_media")
    .update({ deleted_at: null })
    .eq("id", id)
    .select("id, storage_path, deleted_at")
    .single();

  if (error || !data) {
    return Response.json(
      { error: error?.message ?? "Restore failed" },
      { status: 500 }
    );
  }
  return Response.json({ media: data });
}
