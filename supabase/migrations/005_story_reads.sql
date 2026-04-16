-- Track unique story reads per user for celebratory engagement metrics.

create table public.sb_story_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, story_id)
);

create index idx_sb_story_reads_story_id on public.sb_story_reads(story_id);
create index idx_sb_story_reads_read_at on public.sb_story_reads(read_at desc);

alter table public.sb_story_reads enable row level security;

create policy "Users read own story_reads"
  on public.sb_story_reads for select
  using (auth.uid() = user_id);

create policy "Users insert own story_reads"
  on public.sb_story_reads for insert
  with check (auth.uid() = user_id);
