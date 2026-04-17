import { createClient } from "@/lib/supabase/server";
import {
  ALLOWED_MIME,
  MAX_BYTES,
  MEDIA_BUCKET,
  extFromMime,
  mediaUrl,
} from "@/lib/beyond/media";

interface MediaRow {
  id: string;
  owner_type: "story" | "person";
  owner_id: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
  width: number | null;
  height: number | null;
  content_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

/**
 * GET /api/beyond/media?owner_type=story&owner_id=<draft_or_story_id>
 * Public listing of active media for an owner, ordered by sort_order.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const ownerType = url.searchParams.get("owner_type");
  const ownerId = url.searchParams.get("owner_id");
  if (
    (ownerType !== "story" && ownerType !== "person") ||
    !ownerId
  ) {
    return Response.json({ error: "owner_type and owner_id required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sb_media")
    .select(
      "id, owner_type, owner_id, storage_path, caption, sort_order, width, height, content_type, uploaded_by, created_at"
    )
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const media = (data as MediaRow[]).map((m) => ({
    ...m,
    url: mediaUrl(baseUrl, m.storage_path),
    thumb_url: mediaUrl(baseUrl, m.storage_path, { width: 256 }),
    display_url: mediaUrl(baseUrl, m.storage_path, { width: 1024 }),
  }));
  return Response.json({ media });
}

/**
 * POST /api/beyond/media — multipart upload. Fields:
 *   file (File) — required
 *   owner_type (string) — "story" | "person"
 *   owner_id (string) — draft id or person uuid
 *   caption (string, optional)
 *
 * The route uploads to Storage under the user's session (so bucket RLS
 * applies), then inserts the sb_media row (where row RLS applies).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const ownerType = String(form.get("owner_type") ?? "");
  const ownerId = String(form.get("owner_id") ?? "");
  const caption = form.get("caption") ? String(form.get("caption")) : null;

  if (!(file instanceof Blob)) {
    return Response.json({ error: "file is required" }, { status: 400 });
  }
  if (ownerType !== "story" && ownerType !== "person") {
    return Response.json({ error: "invalid owner_type" }, { status: 400 });
  }
  if (!ownerId) {
    return Response.json({ error: "owner_id required" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mime)) {
    return Response.json(
      { error: `Unsupported file type: ${mime}` },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "File too large (>15MB)" }, { status: 413 });
  }

  const ext = extFromMime(mime);
  const objectId = crypto.randomUUID();
  const storagePath = `${ownerType === "story" ? "stories" : "people"}/${ownerId}/${objectId}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: mime,
      upsert: false,
    });
  if (uploadError) {
    return Response.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Compute next sort_order for this owner.
  const { data: maxRow } = await supabase
    .from("sb_media")
    .select("sort_order")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data: row, error: insertError } = await supabase
    .from("sb_media")
    .insert({
      owner_type: ownerType,
      owner_id: ownerId,
      storage_path: storagePath,
      caption,
      sort_order: nextOrder,
      content_type: mime,
      byte_size: file.size,
      uploaded_by: user.id,
    })
    .select(
      "id, owner_type, owner_id, storage_path, caption, sort_order, width, height, content_type, uploaded_by, created_at"
    )
    .single();

  if (insertError || !row) {
    // Clean up the orphaned storage object.
    await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
    return Response.json(
      { error: insertError?.message ?? "Failed to record media" },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return Response.json({
    media: {
      ...row,
      url: mediaUrl(baseUrl, row.storage_path),
      thumb_url: mediaUrl(baseUrl, row.storage_path, { width: 256 }),
      display_url: mediaUrl(baseUrl, row.storage_path, { width: 1024 }),
    },
  });
}
