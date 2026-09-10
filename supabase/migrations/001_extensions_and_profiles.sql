-- =====================================================================
-- 001_extensions_and_profiles.sql
-- Extensions, profiles table, public_user_id generator
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles: 1:1 with auth.users
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  public_user_id text not null unique,
  full_name text not null,
  university_name text not null,
  faculty text null,
  course text null,
  avatar_url text null,
  timezone text not null default 'Asia/Tashkent',
  currency text not null default 'UZS',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint public_user_id_format check (public_user_id ~ '^[0-9]{7}$'),
  constraint full_name_length check (char_length(trim(full_name)) between 1 and 120),
  constraint university_name_length check (char_length(trim(university_name)) between 1 and 200)
);

create index if not exists idx_profiles_auth_user_id on public.profiles(auth_user_id);

comment on table public.profiles is 'One row per application user, linked 1:1 to auth.users. public_user_id is the 7-digit friendly identifier shown to the user.';

-- ---------------------------------------------------------------------
-- updated_at auto-touch trigger (reused across many tables)
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 7-digit unique public_user_id generator with collision retry
-- ---------------------------------------------------------------------
create or replace function public.generate_public_user_id()
returns text
language plpgsql
as $$
declare
  candidate text;
  attempts int := 0;
begin
  loop
    candidate := lpad(floor(random() * 10000000)::text, 7, '0');
    attempts := attempts + 1;

    if not exists (select 1 from public.profiles p where p.public_user_id = candidate) then
      return candidate;
    end if;

    if attempts > 50 then
      raise exception 'Could not generate unique public_user_id after % attempts', attempts;
    end if;
  end loop;
end;
$$;

comment on function public.generate_public_user_id is 'Generates a random 7-digit string not already used in profiles.public_user_id, retrying on collision.';

-- ---------------------------------------------------------------------
-- RPC used by onboarding flow: create profile for the current auth user
-- ---------------------------------------------------------------------
create or replace function public.create_profile(
  p_full_name text,
  p_university_name text,
  p_faculty text default null,
  p_course text default null,
  p_timezone text default 'Asia/Tashkent',
  p_currency text default 'UZS'
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_new_id text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.profiles where auth_user_id = auth.uid()) then
    raise exception 'Profile already exists for this user';
  end if;

  v_new_id := public.generate_public_user_id();

  insert into public.profiles (
    auth_user_id, public_user_id, full_name, university_name,
    faculty, course, timezone, currency
  ) values (
    auth.uid(), v_new_id, trim(p_full_name), trim(p_university_name),
    p_faculty, p_course, coalesce(p_timezone, 'Asia/Tashkent'), coalesce(p_currency, 'UZS')
  )
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.create_profile from public;
grant execute on function public.create_profile to authenticated;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = auth_user_id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

-- Insert only through the security-definer RPC above (no direct insert policy),
-- delete handled by the account-deletion Edge Function using the service role.
