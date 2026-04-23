-- Snippets: short, private facts/memories. Keith/admin only.
create table if not exists public.sb_snippets (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  text text not null,
  themes text[] not null default '{}',
  people text[] not null default '{}',
  era text check (era in ('childhood','youth','military','career','family','later')),
  expandable boolean not null default true,
  source text not null default 'manual'
    check (source in ('capture-tab','qa-extract','manual')),
  created_by uuid references public.sb_profiles(id) on delete set null,
  updated_by uuid references public.sb_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sb_snippets_themes
  on public.sb_snippets using gin(themes);
create index if not exists idx_sb_snippets_people
  on public.sb_snippets using gin(people);
create index if not exists idx_sb_snippets_era
  on public.sb_snippets(era);
create index if not exists idx_sb_snippets_created_at
  on public.sb_snippets(created_at desc);

-- RLS: private to Keith and admins for all operations.
alter table public.sb_snippets enable row level security;

create policy "Keith or admin can read snippets"
  on public.sb_snippets for select
  using (
    exists (
      select 1 from public.sb_profiles p
      where p.id = auth.uid()
        and (p.role = 'keith' or p.role = 'admin')
    )
  );

create policy "Keith or admin can insert snippets"
  on public.sb_snippets for insert
  with check (
    exists (
      select 1 from public.sb_profiles p
      where p.id = auth.uid()
        and (p.role = 'keith' or p.role = 'admin')
    )
  );

create policy "Keith or admin can update snippets"
  on public.sb_snippets for update
  using (
    exists (
      select 1 from public.sb_profiles p
      where p.id = auth.uid()
        and (p.role = 'keith' or p.role = 'admin')
    )
  );

create policy "Keith or admin can delete snippets"
  on public.sb_snippets for delete
  using (
    exists (
      select 1 from public.sb_profiles p
      where p.id = auth.uid()
        and (p.role = 'keith' or p.role = 'admin')
    )
  );

insert into public.sb_snippets (slug, text, themes, people, era, source) values ('fav-song-silvery-moon', 'Keith''s favorite song is "By the Light of the Silvery Moon."', ARRAY['music']::text[], '{}'::text[], 'childhood', 'manual');
insert into public.sb_snippets (slug, text, themes, people, era, source) values ('first-piano-lessons', 'Keith took piano lessons as a boy but never developed the discipline to practice consistently, a regret that surfaces when he hears certain pieces.', ARRAY['music','adversity']::text[], '{}'::text[], 'childhood', 'manual');
insert into public.sb_snippets (slug, text, themes, people, era, source) values ('mother-frances-seamstress', 'Frances Cobb supported the family as a seamstress, working long hours with quiet determination.', ARRAY['family','work-ethic']::text[], ARRAY['frances-cobb']::text[], 'childhood', 'manual');
insert into public.sb_snippets (slug, text, themes, people, era, source) values ('father-bayne-quiet-leader', 'Bayne Cobb led by example rather than by instruction; steady, calm under stress, never raising his voice.', ARRAY['family','leadership']::text[], ARRAY['bayne-cobb']::text[], 'childhood', 'manual');
insert into public.sb_snippets (slug, text, themes, people, era, source) values ('orlando-1971-relocation', 'In 1971, Keith relocated to Orlando as a young Peat Marwick partner to establish a new office on the Florida frontier.', ARRAY['career-choices','leadership']::text[], '{}'::text[], 'career', 'manual');
insert into public.sb_snippets (slug, text, themes, people, era, source) values ('alamo-ceo-1995', 'Keith became CEO of Alamo Rent A Car in 1995, leading rapid strategic turnaround.', ARRAY['leadership','career-choices']::text[], '{}'::text[], 'career', 'manual');
insert into public.sb_snippets (slug, text, themes, people, era, source) values ('vocabulary-passion', 'Keith has a lifelong passion for vocabulary and the precise use of words; a habit shaped by early reading and reinforced through decades of writing.', ARRAY['curiosity','identity']::text[], '{}'::text[], 'youth', 'manual');
insert into public.sb_snippets (slug, text, themes, people, era, source) values ('sga-president-college', 'Keith served as Student Government Association president in college, an early formative experience in public service and leadership.', ARRAY['leadership','community']::text[], '{}'::text[], 'youth', 'manual');
