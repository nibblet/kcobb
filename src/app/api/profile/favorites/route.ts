import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("sb_story_favorites")
    .select("id, story_id, story_title, favorited_at")
    .eq("user_id", user.id)
    .order("favorited_at", { ascending: false })
    .limit(200);

  return Response.json({ favorites: data ?? [] });
}
