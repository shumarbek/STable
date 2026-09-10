-- =====================================================================
-- 010_analytics_rpc_functions.sql
-- Granular analytics aggregation (spec 48-49): item-level breakdown
-- (e.g. individual drinks), account distribution, income vs expense,
-- monthly trend. All computed in SQL.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Item-level breakdown (e.g. "Coca-Cola 52 000", "Kofe 72 000") from
-- transaction_items, scoped to a date range and optionally an item_type.
-- ---------------------------------------------------------------------
create or replace function public.get_item_breakdown(
  p_start_date date,
  p_end_date date,
  p_item_type text default null
)
returns table (
  item_name text,
  total_amount numeric,
  occurrence_count bigint
)
language sql
security invoker
stable
as $$
  select
    ti.item_name,
    -- Distribute the parent transaction amount evenly across its items
    -- as a reasonable approximation (items don't have individual prices
    -- in the current schema; this gives proportional attribution).
    coalesce(sum(t.amount / greatest(item_counts.cnt, 1)), 0) as total_amount,
    count(*) as occurrence_count
  from public.transaction_items ti
  join public.transactions t on t.id = ti.transaction_id
  join (
    select transaction_id, count(*) as cnt
    from public.transaction_items
    group by transaction_id
  ) item_counts on item_counts.transaction_id = ti.transaction_id
  where t.user_id = auth.uid()
    and t.transaction_date between p_start_date and p_end_date
    and (p_item_type is null or ti.item_type = p_item_type)
  group by ti.item_name
  order by total_amount desc;
$$;

revoke all on function public.get_item_breakdown from public;
grant execute on function public.get_item_breakdown to authenticated;

-- ---------------------------------------------------------------------
-- Account distribution: how much was spent/earned per account.
-- ---------------------------------------------------------------------
create or replace function public.get_account_distribution(
  p_start_date date,
  p_end_date date
)
returns table (
  account_id uuid,
  account_name text,
  total_expense numeric,
  total_income numeric
)
language sql
security invoker
stable
as $$
  select
    a.id as account_id,
    a.name as account_name,
    coalesce(sum(case when t.transaction_type = 'expense' and not t.is_zero_consumption then t.amount end), 0) as total_expense,
    coalesce(sum(case when t.transaction_type = 'income' then t.amount end), 0) as total_income
  from public.user_accounts a
  left join public.transactions t
    on t.account_id = a.id
    and t.transaction_date between p_start_date and p_end_date
  where a.user_id = auth.uid()
  group by a.id, a.name
  having coalesce(sum(case when t.id is not null then 1 else 0 end), 0) > 0
  order by total_expense desc;
$$;

revoke all on function public.get_account_distribution from public;
grant execute on function public.get_account_distribution to authenticated;

-- ---------------------------------------------------------------------
-- Monthly trend for the last N months (income vs expense per month).
-- ---------------------------------------------------------------------
create or replace function public.get_monthly_trend(p_months int default 6)
returns table (
  month_start date,
  total_expense numeric,
  total_income numeric
)
language sql
security invoker
stable
as $$
  with months as (
    select date_trunc('month', current_date)::date - (interval '1 month' * gs) as month_start
    from generate_series(0, p_months - 1) as gs
  )
  select
    m.month_start::date,
    coalesce(sum(case when t.transaction_type = 'expense' and not t.is_zero_consumption then t.amount end), 0) as total_expense,
    coalesce(sum(case when t.transaction_type = 'income' then t.amount end), 0) as total_income
  from months m
  left join public.transactions t
    on t.user_id = auth.uid()
    and date_trunc('month', t.transaction_date) = m.month_start
  group by m.month_start
  order by m.month_start;
$$;

revoke all on function public.get_monthly_trend from public;
grant execute on function public.get_monthly_trend to authenticated;

-- ---------------------------------------------------------------------
-- Top N largest transactions in a date range.
-- ---------------------------------------------------------------------
create or replace function public.get_top_transactions(
  p_start_date date,
  p_end_date date,
  p_limit int default 5
)
returns table (
  id uuid,
  amount numeric,
  note text,
  category_name text,
  transaction_date date
)
language sql
security invoker
stable
as $$
  select
    t.id,
    t.amount,
    t.note,
    c.name as category_name,
    t.transaction_date
  from public.transactions t
  left join public.categories c on c.id = t.category_id
  where t.user_id = auth.uid()
    and t.transaction_type = 'expense'
    and t.transaction_date between p_start_date and p_end_date
  order by t.amount desc
  limit p_limit;
$$;

revoke all on function public.get_top_transactions from public;
grant execute on function public.get_top_transactions to authenticated;

-- ---------------------------------------------------------------------
-- Home-cooked meal statistics (spec section 35): count of zero-amount
-- meal records by meal timing, without inflating monetary totals.
-- ---------------------------------------------------------------------
create or replace function public.get_meal_stats(
  p_start_date date,
  p_end_date date
)
returns table (
  meal_count bigint,
  home_cooked_count bigint
)
language sql
security invoker
stable
as $$
  select
    count(*) filter (where category_id is not null) as meal_count,
    count(*) filter (where is_zero_consumption) as home_cooked_count
  from public.transactions
  where user_id = auth.uid()
    and transaction_type = 'expense'
    and transaction_date between p_start_date and p_end_date;
$$;

revoke all on function public.get_meal_stats from public;
grant execute on function public.get_meal_stats to authenticated;
