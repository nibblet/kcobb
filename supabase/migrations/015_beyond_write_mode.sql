-- Stage 1 of the Beyond canvas: allow drafts created directly in the editor
-- (Write mode) or as revisions of existing chapters (Edit mode) without
-- requiring a chat session.

alter table public.sb_story_drafts
  alter column session_id drop not null;

alter table public.sb_story_drafts
  add column if not exists origin text not null default 'chat'
    check (origin in ('chat', 'write', 'edit'));

-- Backfill: anything with a session_id stays 'chat' (the default). Future
-- direct-write drafts pass 'write' or 'edit'.
update public.sb_story_drafts
  set origin = 'chat'
  where session_id is not null and origin is null;

-- Index to power the Edit-mode list view for a contributor.
create index if not exists idx_sb_story_drafts_contributor_updated
  on public.sb_story_drafts (contributor_id, updated_at desc);
