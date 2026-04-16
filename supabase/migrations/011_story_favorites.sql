-- Favorite stories per user (a bookmark, not a rating)
create table public.sb_story_favorites (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  story_id     text        not null,
  story_title  text        not null default '',
  favorited_at timestamptz not null default now(),
  unique (user_id, story_id)
);

create index idx_sb_story_favorites_user_id
  on public.sb_story_favorites (user_id, favorited_at desc);

alter table public.sb_story_favorites enable row level security;

create policy "Users read own favorites"
  on public.sb_story_favorites for select
  using (auth.uid() = user_id);

create policy "Users insert own favorites"
  on public.sb_story_favorites for insert
  with check (auth.uid() = user_id);

create policy "Users delete own favorites"
  on public.sb_story_favorites for delete
  using (auth.uid() = user_id);
