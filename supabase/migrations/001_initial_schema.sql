-- Keith Cobb Storybook schema
-- All tables use sb_ prefix to avoid collisions with other projects on this Supabase instance

-- Profiles table (extends auth.users)
create table public.sb_profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null default '',
  age integer,
  age_mode text check (age_mode in ('young_reader', 'teen', 'adult')),
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create sb_profiles row on user signup
create or replace function public.handle_new_sb_user()
returns trigger as $$
begin
  insert into public.sb_profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created_sb
  after insert on auth.users
  for each row execute procedure public.handle_new_sb_user();

-- Conversations table
create table public.sb_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.sb_profiles(id) on delete cascade,
  title text,
  age_mode text not null default 'adult' check (age_mode in ('young_reader', 'teen', 'adult')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Messages table
create table public.sb_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.sb_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  cited_story_slugs text[],
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_sb_conversations_user_id on public.sb_conversations(user_id);
create index idx_sb_messages_conversation_id on public.sb_messages(conversation_id);

-- Row Level Security
alter table public.sb_profiles enable row level security;
alter table public.sb_conversations enable row level security;
alter table public.sb_messages enable row level security;

-- sb_profiles: users can read, update, and insert their own profile
create policy "SB users can read own profile"
  on public.sb_profiles for select
  using (auth.uid() = id);

create policy "SB users can update own profile"
  on public.sb_profiles for update
  using (auth.uid() = id);

create policy "SB users can insert own profile"
  on public.sb_profiles for insert
  with check (auth.uid() = id);

-- sb_conversations: users can CRUD their own conversations
create policy "SB users can read own conversations"
  on public.sb_conversations for select
  using (auth.uid() = user_id);

create policy "SB users can create own conversations"
  on public.sb_conversations for insert
  with check (auth.uid() = user_id);

create policy "SB users can update own conversations"
  on public.sb_conversations for update
  using (auth.uid() = user_id);

create policy "SB users can delete own conversations"
  on public.sb_conversations for delete
  using (auth.uid() = user_id);

-- sb_messages: users can read/create messages in their own conversations
create policy "SB users can read messages in own conversations"
  on public.sb_messages for select
  using (
    exists (
      select 1 from public.sb_conversations
      where sb_conversations.id = sb_messages.conversation_id
      and sb_conversations.user_id = auth.uid()
    )
  );

create policy "SB users can create messages in own conversations"
  on public.sb_messages for insert
  with check (
    exists (
      select 1 from public.sb_conversations
      where sb_conversations.id = sb_messages.conversation_id
      and sb_conversations.user_id = auth.uid()
    )
  );
