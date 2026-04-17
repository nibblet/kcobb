import { createClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/beyond/media";

/**
 * GET /api/admin/media — list recent media across all owners, including
 * soft-deleted rows. Admin only.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const includeDeleted = url.searchParams.get("include_deleted") !== "false";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 200);

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

  // Admin RLS path: admins implicitly get SELECT via USING(true)? No — our
  // policy only covers active rows. Query through the service path by using
  // the regular client with the admin session — RLS on sb_media allows
  // SELECT only where deleted_at is null. To see deleted rows admins need to
  // bypass; we use the admin client for this one read.
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  let q = admin
    .from("sb_media")
    .select(
      "id, owner_type, owner_id, storage_path, caption, sort_order, content_type, uploaded_by, created_at, deleted_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!includeDeleted) q = q.is("deleted_at", null);

  const { data, error } = await q;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const media = (data ?? []).map((m) => ({
    ...m,
    thumb_url: mediaUrl(baseUrl, m.storage_path, { width: 256 }),
    display_url: mediaUrl(baseUrl, m.storage_path, { width: 1024 }),
  }));
  return Response.json({ media });
}
