-- Link a saved passage to its "Ask Keith" conversation so users can resume later
alter table public.sb_story_highlights
  add column if not exists passage_ask_conversation_id uuid
  references public.sb_conversations (id)
  on delete set null;

create index if not exists idx_sb_story_highlights_passage_ask_conv
  on public.sb_story_highlights (passage_ask_conversation_id)
  where passage_ask_conversation_id is not null;

-- Allow users to update their own highlights (for linking / re-linking conversation)
create policy "Users update own highlights"
  on public.sb_story_highlights for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
