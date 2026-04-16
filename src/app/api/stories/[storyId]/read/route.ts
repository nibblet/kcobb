import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!storyId?.trim()) {
    return Response.json({ error: "storyId required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("sb_story_reads")
    .upsert(
      {
        user_id: user.id,
        story_id: storyId.trim(),
      },
      {
        onConflict: "user_id,story_id",
        ignoreDuplicates: true,
      }
    );

  if (error) {
    return Response.json(
      { error: "Failed to mark story as read" },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}
