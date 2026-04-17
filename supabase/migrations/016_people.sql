-- Stage 2 of the Beyond canvas: people as first-class entities.
-- sb_people becomes the source of truth; markdown under content/wiki/people is
-- regenerated on publish. sb_story_people connects stories to the people they
-- reference via @mentions in the editor.

create table if not exists public.sb_people (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  display_name text not null,
  relationship text,
  bio_md text,
  birth_year integer,
  death_year integer,
  created_by uuid references public.sb_profiles(id) on delete set null,
  updated_by uuid references public.sb_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sb_people_display_name
  on public.sb_people (lower(display_name));

-- Link table: a draft or published story can mention any number of people.
-- owner_type discriminates between a draft (sb_story_drafts.id) and a
-- published story_id string like P2_S01.
create table if not exists public.sb_story_people (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('draft', 'story')),
  owner_id text not null,
  person_id uuid not null references public.sb_people(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (owner_type, owner_id, person_id)
);

create index if not exists idx_sb_story_people_owner
  on public.sb_story_people (owner_type, owner_id);
create index if not exists idx_sb_story_people_person
  on public.sb_story_people (person_id);

-- RLS
alter table public.sb_people enable row level security;
alter table public.sb_story_people enable row level security;

-- People are public-readable (they power person pages, autocomplete,
-- reading-view links). Writes are restricted to Keith or admins.
create policy "Anyone can read people"
  on public.sb_people for select
  using (true);

create policy "Keith or admin can insert people"
  on public.sb_people for insert
  with check (
    exists (
      select 1 from public.sb_profiles p
      where p.id = auth.uid()
        and (p.role = 'keith' or p.role = 'admin')
    )
  );

create policy "Keith or admin can update people"
  on public.sb_people for update
  using (
    exists (
      select 1 from public.sb_profiles p
      where p.id = auth.uid()
        and (p.role = 'keith' or p.role = 'admin')
    )
  );

-- Story-people links: readable by anyone (mentions are public on published
-- stories); written by Keith/admin, or by the draft owner when linking their
-- own draft.
create policy "Anyone can read story_people"
  on public.sb_story_people for select
  using (true);

create policy "Keith admin or draft owner can insert story_people"
  on public.sb_story_people for insert
  with check (
    exists (
      select 1 from public.sb_profiles p
      where p.id = auth.uid()
        and (p.role = 'keith' or p.role = 'admin')
    )
    or (
      owner_type = 'draft'
      and exists (
        select 1 from public.sb_story_drafts d
        where d.id::text = owner_id
          and d.contributor_id = auth.uid()
      )
    )
  );

create policy "Keith admin or draft owner can delete story_people"
  on public.sb_story_people for delete
  using (
    exists (
      select 1 from public.sb_profiles p
      where p.id = auth.uid()
        and (p.role = 'keith' or p.role = 'admin')
    )
    or (
      owner_type = 'draft'
      and exists (
        select 1 from public.sb_story_drafts d
        where d.id::text = owner_id
          and d.contributor_id = auth.uid()
      )
    )
  );
