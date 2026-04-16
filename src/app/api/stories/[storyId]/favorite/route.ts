import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params;
  if (!storyId?.trim()) {
    return Response.json({ error: "storyId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(`${user.id}:favorite`, 60, 60_000);
  if (!rateLimit.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { story_title?: string; action?: "add" | "remove" } = {};
  try {
    body = await request.json();
  } catch {
    /* empty body is ok — defaults to add */
  }

  const action = body.action;
  const storyTitle = typeof body.story_title === "string" ? body.story_title : "";

  if (action === "remove") {
    await supabase
      .from("sb_story_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("story_id", storyId);
    return Response.json({ favorited: false });
  }

  // Insert (ignore conflict so double-click is safe)
  await supabase
    .from("sb_story_favorites")
    .upsert(
      { user_id: user.id, story_id: storyId, story_title: storyTitle },
      { onConflict: "user_id,story_id", ignoreDuplicates: true }
    );
  return Response.json({ favorited: true });
}
