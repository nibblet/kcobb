-- Track whether the asker has seen an answer to their own question. Set to
-- true when they visit /profile/questions. Drives the Profile-nav unread dot.

alter table public.sb_chapter_questions
  add column asker_seen boolean not null default false;

-- Askers can update their own question rows so the seen-flag flip works
-- under RLS. Question text editing is low-risk for a family app; if we
-- want stricter column-level control later we can move to a SECURITY
-- DEFINER helper like we did for the read policies.
create policy "Askers update their own questions"
  on public.sb_chapter_questions for update
  using (auth.uid() = asker_id)
  with check (auth.uid() = asker_id);
