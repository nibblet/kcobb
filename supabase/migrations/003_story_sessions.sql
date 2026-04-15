-- Story contribution tables: sessions, messages, and drafts
-- Supports the /tell feature where family members contribute stories via guided AI chat

-- The chat conversation that gathers story material
create table public.sb_story_sessions (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references public.sb_profiles(id) on delete cascade,
  status text not null default 'gathering'
    check (status in ('gathering', 'drafting', 'review', 'published')),
  volume text not null default 'P2',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Individual messages in the story-gathering chat
create table public.sb_story_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sb_story_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- The composed story draft (output of the chat)
create table public.sb_story_drafts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sb_story_sessions(id) on delete cascade,
  contributor_id uuid not null references public.sb_profiles(id) on delete cascade,
  title text not null,
  body text not null,
  life_stage text,
  year_start integer,
  year_end integer,
  themes text[],
  principles text[],
  quotes text[],
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'published')),
  story_id text,  -- assigned on publish: P2_S01, P4_S01, etc.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_sb_story_sessions_contributor on public.sb_story_sessions(contributor_id);
create index idx_sb_story_messages_session on public.sb_story_messages(session_id);
create index idx_sb_story_drafts_session on public.sb_story_drafts(session_id);
create index idx_sb_story_drafts_contributor on public.sb_story_drafts(contributor_id);

-- Row Level Security
alter table public.sb_story_sessions enable row level security;
alter table public.sb_story_messages enable row level security;
alter table public.sb_story_drafts enable row level security;

-- Story sessions: users can CRUD their own sessions
create policy "Users can read own story sessions"
  on public.sb_story_sessions for select
  using (auth.uid() = contributor_id);

create policy "Users can create own story sessions"
  on public.sb_story_sessions for insert
  with check (auth.uid() = contributor_id);

create policy "Users can update own story sessions"
  on public.sb_story_sessions for update
  using (auth.uid() = contributor_id);

-- Story messages: users can read/create messages in their own sessions
create policy "Users can read messages in own sessions"
  on public.sb_story_messages for select
  using (
    exists (
      select 1 from public.sb_story_sessions
      where sb_story_sessions.id = sb_story_messages.session_id
      and sb_story_sessions.contributor_id = auth.uid()
    )
  );

create policy "Users can create messages in own sessions"
  on public.sb_story_messages for insert
  with check (
    exists (
      select 1 from public.sb_story_sessions
      where sb_story_sessions.id = sb_story_messages.session_id
      and sb_story_sessions.contributor_id = auth.uid()
    )
  );

-- Story drafts: users can read/create/update their own drafts
create policy "Users can read own drafts"
  on public.sb_story_drafts for select
  using (auth.uid() = contributor_id);

create policy "Users can create own drafts"
  on public.sb_story_drafts for insert
  with check (auth.uid() = contributor_id);

create policy "Users can update own drafts"
  on public.sb_story_drafts for update
  using (auth.uid() = contributor_id);

-- Admin policies: admins can read all sessions, messages, and drafts
create policy "Admins can read all story sessions"
  on public.sb_story_sessions for select
  using (
    exists (
      select 1 from public.sb_profiles
      where sb_profiles.id = auth.uid()
      and sb_profiles.role = 'admin'
    )
  );

create policy "Admins can update all story sessions"
  on public.sb_story_sessions for update
  using (
    exists (
      select 1 from public.sb_profiles
      where sb_profiles.id = auth.uid()
      and sb_profiles.role = 'admin'
    )
  );

create policy "Admins can read all story messages"
  on public.sb_story_messages for select
  using (
    exists (
      select 1 from public.sb_profiles
      where sb_profiles.id = auth.uid()
      and sb_profiles.role = 'admin'
    )
  );

create policy "Admins can read all drafts"
  on public.sb_story_drafts for select
  using (
    exists (
      select 1 from public.sb_profiles
      where sb_profiles.id = auth.uid()
      and sb_profiles.role = 'admin'
    )
  );

create policy "Admins can update all drafts"
  on public.sb_story_drafts for update
  using (
    exists (
      select 1 from public.sb_profiles
      where sb_profiles.id = auth.uid()
      and sb_profiles.role = 'admin'
    )
  );
