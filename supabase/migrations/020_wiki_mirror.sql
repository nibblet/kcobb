-- Supabase-backed wiki mirror for compiled story artifacts.
--
-- Drafts remain the authoring/workflow source of truth. Rows in
-- sb_wiki_documents are generated artifacts that let the wiki/Ask layer read
-- published DB stories in the same markdown shape as content/wiki files.

alter table public.sb_story_drafts
  drop constraint if exists sb_story_drafts_status_check;

alter table public.sb_story_drafts
  add constraint sb_story_drafts_status_check
  check (status in ('draft', 'approved', 'published', 'superseded'));

create table if not exists public.sb_story_integrations (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.sb_story_drafts(id) on delete cascade,
  story_id text not null,
  version integer not null default 1,
  content_hash text not null,
  summary text not null default '',
  life_stage text,
  year_start integer,
  year_end integer,
  themes text[] not null default '{}',
  principles text[] not null default '{}',
  heuristics text[] not null default '{}',
  quotes text[] not null default '{}',
  timeline_events jsonb not null default '[]'::jsonb,
  related_story_ids text[] not null default '{}',
  best_used_when text[] not null default '{}',
  people_mentions text[] not null default '{}',
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (draft_id, version)
);

create index if not exists idx_sb_story_integrations_story_id
  on public.sb_story_integrations (story_id);

create table if not exists public.sb_wiki_documents (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null
    check (doc_type in ('story', 'theme', 'principle', 'timeline', 'index', 'ask_context')),
  doc_key text not null,
  title text not null default '',
  markdown text not null,
  source_draft_id uuid references public.sb_story_drafts(id) on delete set null,
  story_id text,
  version integer not null default 1,
  status text not null default 'active'
    check (status in ('active', 'superseded')),
  content_hash text not null default '',
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doc_type, doc_key, version)
);

create unique index if not exists idx_sb_wiki_documents_active_key
  on public.sb_wiki_documents (doc_type, doc_key)
  where status = 'active';

create index if not exists idx_sb_wiki_documents_story_id
  on public.sb_wiki_documents (story_id)
  where story_id is not null;

alter table public.sb_story_integrations enable row level security;
alter table public.sb_wiki_documents enable row level security;

drop policy if exists "Users can read active wiki documents" on public.sb_wiki_documents;
create policy "Users can read active wiki documents"
  on public.sb_wiki_documents for select
  using (status = 'active');

drop policy if exists "Keith admin can read story integrations" on public.sb_story_integrations;
create policy "Keith admin can read story integrations"
  on public.sb_story_integrations for select
  using (
    exists (
      select 1 from public.sb_profiles p
      where p.id = auth.uid()
      and (p.role = 'keith' or p.role = 'admin')
    )
  );

drop policy if exists "Keith admin can write story integrations" on public.sb_story_integrations;
create policy "Keith admin can write story integrations"
  on public.sb_story_integrations for all
  using (
    exists (
      select 1 from public.sb_profiles p
      where p.id = auth.uid()
      and (p.role = 'keith' or p.role = 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.sb_profiles p
      where p.id = auth.uid()
      and (p.role = 'keith' or p.role = 'admin')
    )
  );

drop policy if exists "Keith admin can write wiki documents" on public.sb_wiki_documents;
create policy "Keith admin can write wiki documents"
  on public.sb_wiki_documents for all
  using (
    exists (
      select 1 from public.sb_profiles p
      where p.id = auth.uid()
      and (p.role = 'keith' or p.role = 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.sb_profiles p
      where p.id = auth.uid()
      and (p.role = 'keith' or p.role = 'admin')
    )
  );
