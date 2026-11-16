-- Database-level half of the approval gate. Apply after 024.
--
-- 024 + src/proxy.ts keep unapproved accounts out of the app. But this
-- Supabase project is shared, so anyone with an account (or just the public
-- anon key) can also call the REST API directly, and several sb_* read
-- policies never look at the memoir role:
--   sb_wiki_documents  (status = 'active')        sb_people, sb_story_people (true)
--   sb_media           (deleted_at is null)       sb_story_audio, sb_narration_audio
--   sb_chapter_questions / sb_chapter_answers public reads (any signed-in user)
--
-- Instead of rewriting each of those, this adds one RESTRICTIVE policy per
-- table. Restrictive policies are AND-ed with the existing permissive ones,
-- so every existing rule keeps working for approved members and nothing is
-- reachable by anyone else.
--
-- Not affected:
--   * sb_profiles — deliberately skipped. A pending user must still be able
--     to read their own row (the proxy and the pending page rely on it), and
--     024's trigger already stops them changing their role.
--   * The service-role key and the table owner bypass RLS, so server code
--     using createAdminClient(), the SQL editor, and the signup trigger
--     behave as before.
--   * Anything that is not a public.sb_* table (cel_*, public.profiles, ...).
--
-- Not covered: files in the public storage buckets (story-audio,
-- beyond-media) are served by URL without any policy check. This migration
-- hides the tables that list those paths, not the files themselves.

-- 1. "Is the caller an approved memoir member?"
--    SECURITY DEFINER so it can read sb_profiles regardless of the caller's
--    own policies; it only ever answers about auth.uid(), so it reveals
--    nothing about other accounts. Keep the role list in step with
--    APPROVED_ROLES in src/lib/auth/approval.ts.
create or replace function public.sb_is_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.sb_profiles
    where id = (select auth.uid())
      and role in ('member', 'keith', 'admin')
  );
$$;

-- Policies are evaluated as the calling role, so the API roles need EXECUTE.
grant execute on function public.sb_is_approved() to anon, authenticated;

-- 2. One restrictive policy on every existing public.sb_* table except
--    sb_profiles. Done as a loop over the catalog because the live database
--    and this folder have drifted (e.g. sb_profile_reflections from 019 is
--    not present live), and a hard-coded list would fail on a missing table.
--
--    NOTE for future migrations: a NEW sb_* table does not get this policy
--    automatically. Add the same statement for it, or re-run this block.
do $$
declare
  t record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relname like 'sb\_%'
      and c.relname <> 'sb_profiles'
    order by c.relname
  loop
    execute format(
      'alter table public.%I enable row level security', t.relname);
    execute format(
      'drop policy if exists "Approved members only" on public.%I', t.relname);
    -- "for all" with only USING also applies the expression as WITH CHECK,
    -- so reads and writes are both limited. The (select ...) wrapper lets
    -- Postgres evaluate the function once per statement, not once per row.
    execute format(
      'create policy "Approved members only" on public.%I '
      'as restrictive for all to public '
      'using ((select public.sb_is_approved()))',
      t.relname);
  end loop;
end;
$$;

-- To check afterwards (expect one row per sb_* table other than sb_profiles):
--   select tablename from pg_policies
--   where schemaname = 'public' and policyname = 'Approved members only'
--   order by tablename;
--
-- To undo:
--   run "drop policy "Approved members only" on public.<table>;" for each
--   table listed by the query above, then
--   drop function public.sb_is_approved();
