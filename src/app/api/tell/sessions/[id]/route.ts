import { createClient } from "@/lib/supabase/server";

export async function GET(
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

  const { data: session } = await supabase
    .from("sb_story_sessions")
    .select("id, contributor_id")
    .eq("id", id)
    .single();

  if (!session || session.contributor_id !== user.id) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: messages, error: messagesError } = await supabase
    .from("sb_story_messages")
    .select("role, content")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    return Response.json({ error: "Failed to load messages" }, { status: 500 });
  }

  return Response.json({ messages: messages || [] });
}
