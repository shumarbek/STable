-- =====================================================================
-- 002_accounts_and_categories.sql
-- user_accounts (wallets) + categories (hierarchical, default + custom)
-- =====================================================================

-- ---------------------------------------------------------------------
-- user_accounts
-- ---------------------------------------------------------------------
create table if not exists public.user_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'cash',
  balance numeric(18,2) not null default 0,
  currency text not null default 'UZS',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_accounts_type_check check (
    type in ('cash', 'card', 'bank', 'ewallet', 'other')
  ),
  constraint user_accounts_name_length check (char_length(trim(name)) between 1 and 60)
);

create index if not exists idx_user_accounts_user_id on public.user_accounts(user_id);

create trigger trg_user_accounts_updated_at
  before update on public.user_accounts
  for each row
  execute function public.set_updated_at();

alter table public.user_accounts enable row level security;

create policy "user_accounts_select_own" on public.user_accounts
  for select using (auth.uid() = user_id);
create policy "user_accounts_insert_own" on public.user_accounts
  for insert with check (auth.uid() = user_id);
create policy "user_accounts_update_own" on public.user_accounts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_accounts_delete_own" on public.user_accounts
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- categories: hierarchical, system (user_id null) or custom (user_id set)
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete cascade,
  parent_id uuid null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null,
  icon text null,
  color text null,
  type text not null default 'expense',
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint categories_type_check check (type in ('expense', 'income', 'transfer')),
  constraint categories_name_length check (char_length(trim(name)) between 1 and 80),
  constraint categories_slug_format check (slug ~ '^[a-z0-9-]+$')
);

-- A slug must be unique within the same owner scope (system vs a given user)
create unique index if not exists uq_categories_slug_owner
  on public.categories (coalesce(user_id::text, 'system'), slug);

create index if not exists idx_categories_user_id on public.categories(user_id);
create index if not exists idx_categories_parent_id on public.categories(parent_id);
create index if not exists idx_categories_type on public.categories(type);

create trigger trg_categories_updated_at
  before update on public.categories
  for each row
  execute function public.set_updated_at();

alter table public.categories enable row level security;

-- Everyone (any authenticated user) can read system categories (user_id is null)
-- plus their own custom categories.
create policy "categories_select_visible" on public.categories
  for select using (user_id is null or auth.uid() = user_id);

create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id);

create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- tags (user-owned, free-form labels for transactions)
-- ---------------------------------------------------------------------
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),

  constraint tags_name_length check (char_length(trim(name)) between 1 and 40)
);

create unique index if not exists uq_tags_user_name on public.tags (user_id, lower(name));

alter table public.tags enable row level security;

create policy "tags_select_own" on public.tags
  for select using (auth.uid() = user_id);
create policy "tags_insert_own" on public.tags
  for insert with check (auth.uid() = user_id);
create policy "tags_update_own" on public.tags
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tags_delete_own" on public.tags
  for delete using (auth.uid() = user_id);
