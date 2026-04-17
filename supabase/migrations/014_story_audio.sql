-- Story audio cache (ElevenLabs-generated MP3s)
-- Audio is generated on-demand on first listen and cached in Storage.
-- Cache key is (story_id, voice_id) so swapping voices creates a fresh cache set.

-- Public bucket (audio is non-sensitive; app auth gates the UI).
insert into storage.buckets (id, name, public)
values ('story-audio', 'story-audio', true)
on conflict (id) do nothing;

-- Audio generation ledger.
create table if not exists public.sb_story_audio (
  id uuid primary key default gen_random_uuid(),
  story_id text not null,
  voice_id text not null,
  model text not null,
  storage_path text not null,
  byte_size integer not null,
  char_count integer not null,
  duration_sec integer,
  created_at timestamptz not null default now(),
  unique (story_id, voice_id)
);

create index if not exists sb_story_audio_story_idx
  on public.sb_story_audio (story_id);

alter table public.sb_story_audio enable row level security;

-- Any authed user can read the ledger (the audio files themselves are in a public bucket).
drop policy if exists "audio readable by authed" on public.sb_story_audio;
create policy "audio readable by authed" on public.sb_story_audio
  for select
  using (auth.role() = 'authenticated');

-- Writes are service-role only (bypasses RLS) — no insert/update policy for normal users.
