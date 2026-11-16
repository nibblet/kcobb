-- Approval gate for the memoir app.
--
-- This Supabase project is shared with other apps that use the same
-- auth.users table, so "is signed in" is not enough to prove someone is
-- family. From this migration on, a new sb_profiles row starts as 'pending'
-- and the app (src/proxy.ts) only admits 'member', 'keith' and 'admin'.
--
-- What this does NOT do:
--   * It does not update any existing sb_profiles row. Everyone who has a
--     profile today keeps the role they have.
--   * It does not touch cel_* tables, public.profiles, or the
--     on_auth_user_created / handle_new_user trigger (other apps).

-- 1. Allow 'pending' as a role. Existing values (admin/member/keith) remain
--    valid, so the re-added constraint validates against current rows.
alter table public.sb_profiles
  drop constraint if exists sb_profiles_role_check;

alter table public.sb_profiles
  add constraint sb_profiles_role_check
  check (role in ('admin', 'member', 'keith', 'pending'));

-- 2. New rows default to 'pending'. A column default only applies to future
--    inserts; it does not rewrite existing rows.
alter table public.sb_profiles
  alter column role set default 'pending';

-- 3. Signup trigger: same age / display_name logic as migration 002, but the
--    role is now written explicitly as 'pending'.
create or replace function public.handle_new_sb_user()
returns trigger as $$
declare
  v_age integer;
  v_mode text;
  raw_age text;
begin
  raw_age := nullif(trim(new.raw_user_meta_data->>'age'), '');
  if raw_age is not null and raw_age ~ '^[0-9]+$' then
    v_age := raw_age::integer;
    if v_age < 1 or v_age > 120 then
      v_age := null;
    end if;
  else
    v_age := null;
  end if;

  if v_age is not null then
    if v_age <= 10 then
      v_mode := 'young_reader';
    elsif v_age <= 17 then
      v_mode := 'teen';
    else
      v_mode := 'adult';
    end if;
  else
    v_mode := null;
  end if;

  insert into public.sb_profiles (id, display_name, age, age_mode, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    v_age,
    v_mode,
    'pending'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 4. Stop signed-in users from choosing their own role.
--
--    The existing policies "SB users can update own profile" /
--    "SB users can insert own profile" only check auth.uid() = id, and the
--    anon/authenticated roles hold UPDATE and INSERT on every column, so a
--    signed-in user could run
--        update sb_profiles set role = 'admin' where id = auth.uid()
--    from the browser. That would defeat the gate.
--
--    A trigger is used instead of column-level grants so that columns added
--    later stay writable without anyone having to remember a grant.
--
--    The function is SECURITY INVOKER on purpose: current_user is then the
--    role that issued the statement. Requests made with the anon or user
--    key run as 'anon' / 'authenticated'. The service-role key, the SQL
--    editor, and handle_new_sb_user() (security definer, owned by postgres)
--    run as other roles and are unaffected.
create or replace function public.sb_profiles_guard_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      -- A client creating its own missing profile row always starts pending.
      new.role := 'pending';
    elsif new.role is distinct from old.role then
      raise exception 'sb_profiles.role can only be changed by an administrator'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists sb_profiles_guard_role on public.sb_profiles;

create trigger sb_profiles_guard_role
  before insert or update on public.sb_profiles
  for each row execute function public.sb_profiles_guard_role();

-- To approve someone by hand (the app's Pending accounts screen does the
-- same thing):
--   update public.sb_profiles set role = 'member', updated_at = now()
--   where id = (select id from auth.users where email = 'someone@example.com');
