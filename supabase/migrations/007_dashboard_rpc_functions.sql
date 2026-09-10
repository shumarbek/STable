-- =====================================================================
-- 007_dashboard_rpc_functions.sql
-- SQL-side aggregation functions for dashboard/analytics. All heavy
-- computation (SUM/COUNT/GROUP BY) happens here, not in JavaScript.
-- Each function is SECURITY INVOKER (default) so RLS on transactions
-- still applies — a user can only ever aggregate their own rows,
-- even if they pass another p_user_id (belt-and-suspenders: we also
-- force p_user_id = auth.uid() inside).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Dashboard summary: today / this week / this month totals in one call.
-- ---------------------------------------------------------------------
create or replace function public.get_dashboard_summary(p_timezone text default 'Asia/Tashkent')
returns table (
  today_expense numeric,
  today_income numeric,
  today_transaction_count bigint,
  week_expense numeric,
  week_income numeric,
  week_avg_daily_expense numeric,
  month_expense numeric,
  month_income numeric,
  month_avg_daily_expense numeric,
  current_balance numeric
)
language sql
security invoker
stable
as $$
  with bounds as (
    select
      (now() at time zone p_timezone)::date as today,
      date_trunc('week', (now() at time zone p_timezone)::date)::date as week_start,
      date_trunc('month', (now() at time zone p_timezone)::date)::date as month_start
  ),
  scoped as (
    select t.*
    from public.transactions t, bounds b
    where t.user_id = auth.uid()
      and t.transaction_date >= b.month_start - interval '1 month' -- small buffer, filtered again below
  )
  select
    coalesce(sum(case when s.transaction_date = b.today and s.transaction_type = 'expense' and not s.is_zero_consumption then s.amount end), 0) as today_expense,
    coalesce(sum(case when s.transaction_date = b.today and s.transaction_type = 'income' then s.amount end), 0) as today_income,
    coalesce(count(*) filter (where s.transaction_date = b.today), 0) as today_transaction_count,

    coalesce(sum(case when s.transaction_date >= b.week_start and s.transaction_type = 'expense' and not s.is_zero_consumption then s.amount end), 0) as week_expense,
    coalesce(sum(case when s.transaction_date >= b.week_start and s.transaction_type = 'income' then s.amount end), 0) as week_income,
    coalesce(sum(case when s.transaction_date >= b.week_start and s.transaction_type = 'expense' and not s.is_zero_consumption then s.amount end), 0)
      / greatest((b.today - b.week_start + 1), 1) as week_avg_daily_expense,

    coalesce(sum(case when s.transaction_date >= b.month_start and s.transaction_type = 'expense' and not s.is_zero_consumption then s.amount end), 0) as month_expense,
    coalesce(sum(case when s.transaction_date >= b.month_start and s.transaction_type = 'income' then s.amount end), 0) as month_income,
    coalesce(sum(case when s.transaction_date >= b.month_start and s.transaction_type = 'expense' and not s.is_zero_consumption then s.amount end), 0)
      / greatest((b.today - b.month_start + 1), 1) as month_avg_daily_expense,

    (select coalesce(sum(a.balance), 0) from public.user_accounts a where a.user_id = auth.uid() and a.is_active) as current_balance
  from scoped s, bounds b
  group by b.today, b.week_start, b.month_start;
$$;

revoke all on function public.get_dashboard_summary from public;
grant execute on function public.get_dashboard_summary to authenticated;

-- ---------------------------------------------------------------------
-- Top categories for a date range (used by dashboard + reports)
-- ---------------------------------------------------------------------
create or replace function public.get_top_categories(
  p_start_date date,
  p_end_date date,
  p_limit int default 5
)
returns table (
  category_id uuid,
  category_name text,
  category_icon text,
  total_amount numeric,
  percentage numeric
)
language sql
security invoker
stable
as $$
  with totals as (
    select
      c.id as category_id,
      c.name as category_name,
      c.icon as category_icon,
      sum(t.amount) as total_amount
    from public.transactions t
    join public.categories c on c.id = t.category_id
    where t.user_id = auth.uid()
      and t.transaction_type = 'expense'
      and not t.is_zero_consumption
      and t.transaction_date between p_start_date and p_end_date
    group by c.id, c.name, c.icon
  ),
  grand_total as (
    select coalesce(sum(total_amount), 0) as g from totals
  )
  select
    tt.category_id,
    tt.category_name,
    tt.category_icon,
    tt.total_amount,
    case when gt.g > 0 then round((tt.total_amount / gt.g) * 100, 2) else 0 end as percentage
  from totals tt, grand_total gt
  order by tt.total_amount desc
  limit p_limit;
$$;

revoke all on function public.get_top_categories from public;
grant execute on function public.get_top_categories to authenticated;

-- ---------------------------------------------------------------------
-- Daily expense trend for a date range (for line/bar charts)
-- ---------------------------------------------------------------------
create or replace function public.get_daily_trend(
  p_start_date date,
  p_end_date date
)
returns table (
  day date,
  total_expense numeric,
  total_income numeric
)
language sql
security invoker
stable
as $$
  with days as (
    select generate_series(p_start_date, p_end_date, interval '1 day')::date as day
  )
  select
    d.day,
    coalesce(sum(case when t.transaction_type = 'expense' and not t.is_zero_consumption then t.amount end), 0) as total_expense,
    coalesce(sum(case when t.transaction_type = 'income' then t.amount end), 0) as total_income
  from days d
  left join public.transactions t
    on t.transaction_date = d.day and t.user_id = auth.uid()
  group by d.day
  order by d.day;
$$;

revoke all on function public.get_daily_trend from public;
grant execute on function public.get_daily_trend to authenticated;

-- ---------------------------------------------------------------------
-- Calendar month view: per-day expense/income/transaction count
-- ---------------------------------------------------------------------
create or replace function public.get_calendar_month(
  p_year int,
  p_month int
)
returns table (
  day date,
  total_expense numeric,
  total_income numeric,
  transaction_count bigint
)
language sql
security invoker
stable
as $$
  select
    t.transaction_date as day,
    coalesce(sum(case when t.transaction_type = 'expense' and not t.is_zero_consumption then t.amount end), 0) as total_expense,
    coalesce(sum(case when t.transaction_type = 'income' then t.amount end), 0) as total_income,
    count(*) as transaction_count
  from public.transactions t
  where t.user_id = auth.uid()
    and date_part('year', t.transaction_date) = p_year
    and date_part('month', t.transaction_date) = p_month
  group by t.transaction_date
  order by t.transaction_date;
$$;

revoke all on function public.get_calendar_month from public;
grant execute on function public.get_calendar_month to authenticated;

-- ---------------------------------------------------------------------
-- Week-over-week / month-over-month comparison
-- ---------------------------------------------------------------------
create or replace function public.get_period_comparison(
  p_current_start date,
  p_current_end date,
  p_previous_start date,
  p_previous_end date
)
returns table (
  current_expense numeric,
  previous_expense numeric,
  percentage_change numeric
)
language sql
security invoker
stable
as $$
  with cur as (
    select coalesce(sum(amount), 0) as total
    from public.transactions
    where user_id = auth.uid() and transaction_type = 'expense' and not is_zero_consumption
      and transaction_date between p_current_start and p_current_end
  ),
  prev as (
    select coalesce(sum(amount), 0) as total
    from public.transactions
    where user_id = auth.uid() and transaction_type = 'expense' and not is_zero_consumption
      and transaction_date between p_previous_start and p_previous_end
  )
  select
    cur.total as current_expense,
    prev.total as previous_expense,
    case when prev.total > 0 then round(((cur.total - prev.total) / prev.total) * 100, 2) else null end as percentage_change
  from cur, prev;
$$;

revoke all on function public.get_period_comparison from public;
grant execute on function public.get_period_comparison to authenticated;

-- ---------------------------------------------------------------------
-- Budget progress for active budgets in the current period
-- ---------------------------------------------------------------------
create or replace function public.get_budget_progress()
returns table (
  budget_id uuid,
  budget_name text,
  category_id uuid,
  amount_limit numeric,
  spent_amount numeric,
  percentage numeric,
  period text
)
language sql
security invoker
stable
as $$
  with period_bounds as (
    select
      b.id as budget_id,
      b.name,
      b.category_id,
      b.amount_limit,
      b.period,
      case b.period
        when 'weekly' then date_trunc('week', current_date)::date
        when 'monthly' then date_trunc('month', current_date)::date
        when 'yearly' then date_trunc('year', current_date)::date
      end as period_start
    from public.budgets b
    where b.user_id = auth.uid() and b.is_active
  )
  select
    pb.budget_id,
    pb.name as budget_name,
    pb.category_id,
    pb.amount_limit,
    coalesce(sum(t.amount), 0) as spent_amount,
    case when pb.amount_limit > 0 then round((coalesce(sum(t.amount), 0) / pb.amount_limit) * 100, 2) else 0 end as percentage,
    pb.period
  from period_bounds pb
  left join public.transactions t
    on t.user_id = auth.uid()
    and t.transaction_type = 'expense'
    and not t.is_zero_consumption
    and t.transaction_date >= pb.period_start
    and (pb.category_id is null or t.category_id = pb.category_id)
  group by pb.budget_id, pb.name, pb.category_id, pb.amount_limit, pb.period;
$$;

revoke all on function public.get_budget_progress from public;
grant execute on function public.get_budget_progress to authenticated;
