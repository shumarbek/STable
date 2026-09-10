-- =====================================================================
-- 005_reports_and_notifications.sql
-- weekly_reports, report_items, notifications
-- These are written by the service role (Edge Function) only.
-- =====================================================================

create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  total_income numeric(18,2) not null default 0,
  total_expense numeric(18,2) not null default 0,
  net_cash_flow numeric(18,2) not null default 0,
  average_daily_expense numeric(18,2) not null default 0,
  transaction_count int not null default 0,
  top_category_id uuid null references public.categories(id) on delete set null,
  top_transaction_id uuid null references public.transactions(id) on delete set null,
  previous_week_expense numeric(18,2) null,
  percentage_change numeric(6,2) null,
  status text not null default 'pending',
  error_message text null,
  generated_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint weekly_reports_dates_check check (week_end = week_start + 6),
  constraint weekly_reports_status_check check (status in ('pending', 'processing', 'completed', 'failed'))
);

-- Duplicate prevention: only one report per user per week.
create unique index if not exists uq_weekly_reports_user_week
  on public.weekly_reports (user_id, week_start);

create index if not exists idx_weekly_reports_user_id on public.weekly_reports(user_id);
create index if not exists idx_weekly_reports_status on public.weekly_reports(status);

create trigger trg_weekly_reports_updated_at
  before update on public.weekly_reports
  for each row
  execute function public.set_updated_at();

alter table public.weekly_reports enable row level security;

create policy "weekly_reports_select_own" on public.weekly_reports
  for select using (auth.uid() = user_id);

-- Insert/update only via service role (Edge Function bypasses RLS with
-- service key). No client-facing insert/update/delete policy.

-- ---------------------------------------------------------------------
-- report_items: category breakdown rows for a given weekly report
-- ---------------------------------------------------------------------
create table if not exists public.report_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.weekly_reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid null references public.categories(id) on delete set null,
  category_name text not null,
  total_amount numeric(18,2) not null default 0,
  percentage numeric(6,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_report_items_report_id on public.report_items(report_id);
create index if not exists idx_report_items_user_id on public.report_items(user_id);

alter table public.report_items enable row level security;

create policy "report_items_select_own" on public.report_items
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),

  constraint notifications_type_check check (
    type in ('weekly_report', 'budget_warning', 'subscription_due', 'goal_milestone', 'system')
  ),
  constraint notifications_title_length check (char_length(trim(title)) between 1 and 150),
  constraint notifications_message_length check (char_length(message) between 1 and 1000)
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_unread on public.notifications(user_id, is_read);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Insert happens via service role (Edge Function) or SECURITY DEFINER RPCs;
-- delete allowed by owner for cleanup.
create policy "notifications_delete_own" on public.notifications
  for delete using (auth.uid() = user_id);
