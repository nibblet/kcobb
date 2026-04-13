-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null default '',
  age integer,
  age_mode text check (age_mode in ('young_reader', 'teen', 'adult')),
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Conversations table
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  age_mode text not null default 'adult' check (age_mode in ('young_reader', 'teen', 'adult')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  cited_story_slugs text[],
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_conversations_user_id on public.conversations(user_id);
create index idx_messages_conversation_id on public.messages(conversation_id);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Profiles: users can read and update their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Conversations: users can CRUD their own conversations
create policy "Users can read own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can create own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- Messages: users can read/create messages in their own conversations
create policy "Users can read messages in own conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

create policy "Users can create messages in own conversations"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );
