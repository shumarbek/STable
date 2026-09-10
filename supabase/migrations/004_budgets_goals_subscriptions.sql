-- =====================================================================
-- 004_budgets_goals_subscriptions.sql
-- budgets, budget_periods, goals, subscriptions
-- =====================================================================

-- ---------------------------------------------------------------------
-- budgets: a recurring spending limit for a category (e.g. "Food 700k/month")
-- ---------------------------------------------------------------------
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid null references public.categories(id) on delete set null,
  name text not null,
  amount_limit numeric(18,2) not null,
  period text not null default 'monthly',
  warning_threshold_percent int not null default 70,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint budgets_amount_positive check (amount_limit > 0),
  constraint budgets_period_check check (period in ('weekly', 'monthly', 'yearly')),
  constraint budgets_threshold_range check (warning_threshold_percent between 1 and 100),
  constraint budgets_name_length check (char_length(trim(name)) between 1 and 100)
);

create index if not exists idx_budgets_user_id on public.budgets(user_id);
create index if not exists idx_budgets_category_id on public.budgets(category_id);

create trigger trg_budgets_updated_at
  before update on public.budgets
  for each row
  execute function public.set_updated_at();

alter table public.budgets enable row level security;

create policy "budgets_select_own" on public.budgets
  for select using (auth.uid() = user_id);
create policy "budgets_insert_own" on public.budgets
  for insert with check (auth.uid() = user_id);
create policy "budgets_update_own" on public.budgets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budgets_delete_own" on public.budgets
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- budget_periods: materialized per-period progress (one row per budget
-- per period start/end), computed by an RPC / scheduled job.
-- ---------------------------------------------------------------------
create table if not exists public.budget_periods (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  spent_amount numeric(18,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint budget_periods_dates_check check (period_end >= period_start)
);

create unique index if not exists uq_budget_periods_budget_period
  on public.budget_periods (budget_id, period_start);

create index if not exists idx_budget_periods_user_id on public.budget_periods(user_id);

create trigger trg_budget_periods_updated_at
  before update on public.budget_periods
  for each row
  execute function public.set_updated_at();

alter table public.budget_periods enable row level security;

create policy "budget_periods_select_own" on public.budget_periods
  for select using (auth.uid() = user_id);

-- budget_periods are computed server-side (RPC/service role); no direct
-- insert/update/delete policy for regular users.

-- ---------------------------------------------------------------------
-- goals: financial savings goals
-- ---------------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(18,2) not null,
  current_amount numeric(18,2) not null default 0,
  deadline date null,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint goals_target_positive check (target_amount > 0),
  constraint goals_current_nonnegative check (current_amount >= 0),
  constraint goals_name_length check (char_length(trim(name)) between 1 and 100)
);

create index if not exists idx_goals_user_id on public.goals(user_id);

create trigger trg_goals_updated_at
  before update on public.goals
  for each row
  execute function public.set_updated_at();

alter table public.goals enable row level security;

create policy "goals_select_own" on public.goals
  for select using (auth.uid() = user_id);
create policy "goals_insert_own" on public.goals
  for insert with check (auth.uid() = user_id);
create policy "goals_update_own" on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals_delete_own" on public.goals
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- subscriptions: recurring payments (schedule only, not actual transactions)
-- ---------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid null references public.user_accounts(id) on delete set null,
  category_id uuid null references public.categories(id) on delete set null,
  provider_name text not null,
  amount numeric(18,2) not null,
  billing_cycle text not null default 'monthly',
  next_billing_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint subscriptions_amount_positive check (amount > 0),
  constraint subscriptions_cycle_check check (billing_cycle in ('weekly', 'monthly', 'yearly')),
  constraint subscriptions_provider_length check (char_length(trim(provider_name)) between 1 and 100)
);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_next_billing on public.subscriptions(next_billing_date);

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);
create policy "subscriptions_insert_own" on public.subscriptions
  for insert with check (auth.uid() = user_id);
create policy "subscriptions_update_own" on public.subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subscriptions_delete_own" on public.subscriptions
  for delete using (auth.uid() = user_id);
