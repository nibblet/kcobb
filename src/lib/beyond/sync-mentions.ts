import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Replace-all sync of @mention links for a draft. Delete existing rows for
 * this (owner_type='draft', owner_id=draftId) then insert the current set.
 * Small mention counts per story make this simpler than a set-diff.
 */
export async function syncDraftMentions(
  supabase: SupabaseClient,
  draftId: string,
  mentions: { id: string }[] | undefined | null
) {
  await supabase
    .from("sb_story_people")
    .delete()
    .eq("owner_type", "draft")
    .eq("owner_id", draftId);

  const rows = (mentions ?? [])
    .filter((m) => m && m.id && m.id !== "__new__")
    .map((m) => ({
      owner_type: "draft",
      owner_id: draftId,
      person_id: m.id,
    }));

  if (rows.length === 0) return;
  await supabase.from("sb_story_people").upsert(rows, {
    onConflict: "owner_type,owner_id,person_id",
  });
}
