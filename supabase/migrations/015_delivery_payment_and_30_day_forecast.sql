-- Add the requested expense taxonomy and cap the forecast sample at the
-- newest 30 days that actually contain an expense report.

do $$
declare
  v_parent uuid;
  v_id uuid;
begin
  select id into v_parent
  from public.categories
  where user_id is null and slug = 'financial-expenses'
  limit 1;

  select id into v_id
  from public.categories
  where user_id is null and slug = 'financial-payment-fee'
  limit 1;

  if v_id is null then
    insert into public.categories (
      user_id, parent_id, name, slug, icon, type, is_default,
      is_active, sort_order, is_recurring
    ) values (
      null, v_parent, 'To‘lov puli', 'financial-payment-fee', 'receipt-text',
      'expense', true, true, 4, true
    );
  else
    update public.categories
    set parent_id = v_parent, name = 'To‘lov puli', icon = 'receipt-text',
        type = 'expense', is_default = true, is_active = true,
        sort_order = 4, is_recurring = true
    where id = v_id;
  end if;

  select id into v_id
  from public.categories
  where user_id is null and slug = 'delivery'
  limit 1;

  if v_id is null then
    insert into public.categories (
      user_id, parent_id, name, slug, icon, type, is_default,
      is_active, sort_order, is_recurring
    ) values (
      null, null, 'Yetkazib berish', 'delivery', 'truck',
      'expense', true, true, 15, true
    );
  else
    update public.categories
    set parent_id = null, name = 'Yetkazib berish', icon = 'truck',
        type = 'expense', is_default = true, is_active = true,
        sort_order = 15, is_recurring = true
    where id = v_id;
  end if;
end;
$$;

create or replace function public.get_balance_forecast()
returns table (
  cash_balance numeric,
  card_balance numeric,
  balance_date date,
  recurring_total numeric,
  report_day_count bigint
)
language sql
security invoker
stable
as $$
  with snapshot as (
    select coalesce(
      (select min(e.entry_date) from public.balance_entries e where e.user_id = auth.uid()),
      (select max(a.balance_as_of_date) from public.user_accounts a where a.user_id = auth.uid() and a.is_active)
    ) as balance_date
  ), expense_days as (
    select t.transaction_date,
      sum(case when c.is_recurring and not t.is_zero_consumption then t.amount else 0 end) as recurring_amount
    from public.transactions t
    left join public.categories c on c.id = t.category_id
    cross join snapshot s
    where t.user_id = auth.uid() and t.transaction_type = 'expense'
      and (s.balance_date is null or t.transaction_date >= s.balance_date)
    group by t.transaction_date
  ), recent_expense_days as (
    select d.transaction_date, d.recurring_amount
    from expense_days d
    order by d.transaction_date desc
    limit 30
  )
  select
    coalesce((select sum(a.balance) from public.user_accounts a where a.user_id = auth.uid() and a.is_active and a.type = 'cash'), 0),
    coalesce((select sum(a.balance) from public.user_accounts a where a.user_id = auth.uid() and a.is_active and a.type in ('card', 'bank')), 0),
    s.balance_date,
    coalesce((select sum(d.recurring_amount) from recent_expense_days d), 0),
    (select count(*) from recent_expense_days d)
  from snapshot s;
$$;
