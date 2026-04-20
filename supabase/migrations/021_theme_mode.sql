-- Add appearance preference for day/night/auto selection.
alter table public.sb_profiles
  add column if not exists theme_mode text
  check (theme_mode in ('light', 'dark', 'auto'))
  default 'auto';

update public.sb_profiles
set theme_mode = 'auto'
where theme_mode is null;
