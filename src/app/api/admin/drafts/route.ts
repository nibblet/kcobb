import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("sb_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  // Fetch all drafts with contributor info
  const { data: drafts, error } = await supabase
    .from("sb_story_drafts")
    .select(
      "id, title, body, life_stage, year_start, year_end, themes, principles, quotes, status, story_id, created_at, contributor_id"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json(
      { error: "Failed to fetch drafts" },
      { status: 500 }
    );
  }

  // Get contributor names
  const contributorIds = [
    ...new Set((drafts || []).map((d) => d.contributor_id)),
  ];
  const { data: profiles } = await supabase
    .from("sb_profiles")
    .select("id, display_name")
    .in("id", contributorIds);

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, p.display_name])
  );

  const enriched = (drafts || []).map((d) => ({
    ...d,
    contributor: {
      display_name: profileMap.get(d.contributor_id) || "Unknown",
    },
  }));

  return Response.json({ drafts: enriched });
}
