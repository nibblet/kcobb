-- Stage 3 of the Beyond canvas: photos attached to stories and people.
-- Polymorphic owner (story draft id or published story id string, or a
-- person uuid). Files live in the `beyond-media` Storage bucket — see
-- supabase/storage-setup.sql for bucket + policy creation.

create table if not exists public.sb_media (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('story', 'person')),
  owner_id text not null,
  storage_path text not null,
  caption text,
  sort_order integer not null default 0,
  width integer,
  height integer,
  content_type text,
  byte_size bigint,
  uploaded_by uuid references public.sb_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_sb_media_owner
  on public.sb_media (owner_type, owner_id, sort_order)
  where deleted_at is null;

alter table public.sb_media enable row level security;

-- Public read of non-deleted rows — matches the public bucket model so
-- galleries render for any viewer of a story or person page.
create policy "Anyone can read active media"
  on public.sb_media for select
  using (deleted_at is null);

-- Keith/admin can always write. Draft owners can attach media to their own
-- draft while it's in progress.
create policy "Keith admin or draft owner can insert media"
  on public.sb_media for insert
  with check (
    exists (
      select 1 from public.sb_profiles p
      where p.id = auth.uid()
        and (p.role = 'keith' or p.role = 'admin')
    )
    or (
      owner_type = 'story'
      and exists (
        select 1 from public.sb_story_drafts d
        where d.id::text = owner_id
          and d.contributor_id = auth.uid()
      )
    )
  );

create policy "Keith admin or draft owner can update media"
  on public.sb_media for update
  using (
    exists (
      select 1 from public.sb_profiles p
      where p.id = auth.uid()
        and (p.role = 'keith' or p.role = 'admin')
    )
    or (
      owner_type = 'story'
      and exists (
        select 1 from public.sb_story_drafts d
        where d.id::text = owner_id
          and d.contributor_id = auth.uid()
      )
    )
  );

-- Soft-delete is done via UPDATE deleted_at. Hard DELETE is admin-only.
create policy "Admin can delete media"
  on public.sb_media for delete
  using (
    exists (
      select 1 from public.sb_profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
