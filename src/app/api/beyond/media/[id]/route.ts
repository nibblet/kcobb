import { createClient } from "@/lib/supabase/server";
import { MEDIA_BUCKET } from "@/lib/beyond/media";

/**
 * PATCH /api/beyond/media/[id] — update caption or sort_order.
 * RLS on sb_media ensures only authorized users land here.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const patch = (await request.json().catch(() => ({}))) as {
    caption?: string | null;
    sort_order?: number;
  };

  const update: Record<string, unknown> = {};
  if (patch.caption !== undefined) update.caption = patch.caption;
  if (patch.sort_order !== undefined) update.sort_order = patch.sort_order;

  const { data, error } = await supabase
    .from("sb_media")
    .update(update)
    .eq("id", id)
    .is("deleted_at", null)
    .select(
      "id, owner_type, owner_id, storage_path, caption, sort_order, content_type"
    )
    .single();

  if (error || !data) {
    return Response.json(
      { error: error?.message ?? "Update failed" },
      { status: 500 }
    );
  }
  return Response.json({ media: data });
}

/**
 * DELETE /api/beyond/media/[id] — soft delete (marks deleted_at). The
 * storage object stays until an admin tool hard-removes it.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("sb_media")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id, storage_path")
    .single();

  if (error || !data) {
    return Response.json(
      { error: error?.message ?? "Delete failed" },
      { status: 500 }
    );
  }

  // Best-effort cleanup of the storage object. If it fails the soft-delete
  // still hides the photo; an admin can reconcile later.
  await supabase.storage.from(MEDIA_BUCKET).remove([data.storage_path]);

  return Response.json({ ok: true });
}
