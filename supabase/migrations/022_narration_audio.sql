-- Cached narration audio for non-story pages (ElevenLabs MP3s in story-audio bucket).
-- Cache key is (content_hash, voice_id) where content_hash is SHA-256 of canonical narration text.

create table if not exists public.sb_narration_audio (
  id uuid primary key default gen_random_uuid(),
  content_hash text not null,
  voice_id text not null,
  model text not null,
  storage_path text not null,
  byte_size integer not null,
  char_count integer not null,
  duration_sec integer,
  entity_type text,
  created_at timestamptz not null default now(),
  unique (content_hash, voice_id)
);

create index if not exists sb_narration_audio_hash_idx
  on public.sb_narration_audio (content_hash);

alter table public.sb_narration_audio enable row level security;

drop policy if exists "narration audio readable by authed" on public.sb_narration_audio;
create policy "narration audio readable by authed" on public.sb_narration_audio
  for select
  using (auth.role() = 'authenticated');
