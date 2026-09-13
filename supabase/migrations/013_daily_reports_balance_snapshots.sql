-- =====================================================================
-- 013_daily_reports_balance_snapshots.sql
-- Dated balance snapshots, atomic daily expense reports and root-level
-- category reporting.
-- =====================================================================

alter table public.user_accounts
  add column if not exists balance_snapshot_amount numeric(18,2) not null default 0,
  add column if not exists balance_as_of_date date not null default current_date;

update public.user_accounts
set balance_snapshot_amount = balance,
    balance_as_of_date = current_date;

alter table public.user_accounts
  drop constraint if exists user_accounts_snapshot_nonnegative;

alter table public.user_accounts
  add constraint user_accounts_snapshot_nonnegative
  check (balance_snapshot_amount >= 0);

create index if not exists idx_user_accounts_balance_as_of_date
  on public.user_accounts(user_id, balance_as_of_date);

-- A balance entered for a date is treated as the opening balance for that
-- day. Transactions before the snapshot no longer change the current balance.
create or replace function public.transactions_balance_effect()
returns trigger
language plpgsql
as $$
declare
  v_sign numeric;
begin
  if tg_op = 'INSERT' then
    if new.transaction_type in ('income', 'debt_repayment', 'refund') then v_sign := 1;
    elsif new.transaction_type in ('expense', 'loan', 'transfer') then v_sign := -1;
    else v_sign := 0;
    end if;

    if not (new.transaction_type = 'expense' and new.is_zero_consumption)
       and exists (
         select 1 from public.user_accounts a
         where a.id = new.account_id and new.transaction_date >= a.balance_as_of_date
       ) then
      perform public.apply_transaction_balance_delta(new.account_id, v_sign * new.amount);
    end if;

    if new.transaction_type = 'transfer' and new.transfer_account_id is not null
       and exists (
         select 1 from public.user_accounts a
         where a.id = new.transfer_account_id and new.transaction_date >= a.balance_as_of_date
       ) then
      perform public.apply_transaction_balance_delta(new.transfer_account_id, new.amount);
    end if;
    return new;
  end if;

  if old.transaction_type in ('income', 'debt_repayment', 'refund') then v_sign := -1;
  elsif old.transaction_type in ('expense', 'loan', 'transfer') then v_sign := 1;
  else v_sign := 0;
  end if;

  if not (old.transaction_type = 'expense' and old.is_zero_consumption)
     and exists (
       select 1 from public.user_accounts a
       where a.id = old.account_id and old.transaction_date >= a.balance_as_of_date
     ) then
    perform public.apply_transaction_balance_delta(old.account_id, v_sign * old.amount);
  end if;

  if old.transaction_type = 'transfer' and old.transfer_account_id is not null
     and exists (
       select 1 from public.user_accounts a
       where a.id = old.transfer_account_id and old.transaction_date >= a.balance_as_of_date
     ) then
    perform public.apply_transaction_balance_delta(old.transfer_account_id, -old.amount);
  end if;
  return old;
end;
$$;

create or replace function public.transactions_balance_effect_from_row(
  p_row public.transactions,
  p_direction int
)
returns void
language plpgsql
as $$
declare
  v_sign numeric;
begin
  if p_row.transaction_type in ('income', 'debt_repayment', 'refund') then v_sign := 1;
  elsif p_row.transaction_type in ('expense', 'loan', 'transfer') then v_sign := -1;
  else v_sign := 0;
  end if;

  if not (p_row.transaction_type = 'expense' and p_row.is_zero_consumption)
     and exists (
       select 1 from public.user_accounts a
       where a.id = p_row.account_id and p_row.transaction_date >= a.balance_as_of_date
     ) then
    perform public.apply_transaction_balance_delta(
      p_row.account_id, p_direction * v_sign * p_row.amount
    );
  end if;

  if p_row.transaction_type = 'transfer' and p_row.transfer_account_id is not null
     and exists (
       select 1 from public.user_accounts a
       where a.id = p_row.transfer_account_id and p_row.transaction_date >= a.balance_as_of_date
     ) then
    perform public.apply_transaction_balance_delta(
      p_row.transfer_account_id, p_direction * p_row.amount
    );
  end if;
end;
$$;

create or replace function public.set_current_balances(
  p_balance_date date,
  p_cash_balance numeric,
  p_card_balance numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_timezone text;
  v_today date;
  v_type text;
  v_amount numeric;
  v_primary_id uuid;
  v_account record;
  v_delta numeric;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_cash_balance < 0 or p_card_balance < 0 then raise exception 'Invalid balance'; end if;

  select coalesce(p.timezone, 'Asia/Tashkent') into v_timezone
  from public.profiles p where p.auth_user_id = auth.uid();
  v_today := (now() at time zone coalesce(v_timezone, 'Asia/Tashkent'))::date;
  if p_balance_date > v_today then raise exception 'Balance date cannot be in the future'; end if;

  foreach v_type in array array['cash', 'card'] loop
    v_amount := case when v_type = 'cash' then p_cash_balance else p_card_balance end;
    select a.id into v_primary_id
    from public.user_accounts a
    where a.user_id = auth.uid() and a.is_active
      and (a.type = v_type or (v_type = 'card' and a.type = 'bank'))
    order by a.created_at, a.id limit 1;

    if v_primary_id is null then
      insert into public.user_accounts (
        user_id, name, type, balance, balance_snapshot_amount,
        balance_as_of_date, currency
      ) values (
        auth.uid(), case when v_type = 'cash' then 'Naqd' else 'Karta' end,
        v_type, v_amount, v_amount, p_balance_date, 'UZS'
      ) returning id into v_primary_id;
    end if;

    for v_account in
      select a.id
      from public.user_accounts a
      where a.user_id = auth.uid() and a.is_active
        and (a.type = v_type or (v_type = 'card' and a.type = 'bank'))
    loop
      select coalesce(sum(effect), 0) into v_delta
      from (
        select case
          when t.transaction_type in ('income', 'debt_repayment', 'refund') then t.amount
          when t.transaction_type in ('expense', 'loan', 'transfer') then -t.amount
          else 0 end as effect
        from public.transactions t
        where t.user_id = auth.uid() and t.account_id = v_account.id
          and t.transaction_date >= p_balance_date
          and not (t.transaction_type = 'expense' and t.is_zero_consumption)
        union all
        select t.amount
        from public.transactions t
        where t.user_id = auth.uid() and t.transfer_account_id = v_account.id
          and t.transaction_type = 'transfer' and t.transaction_date >= p_balance_date
      ) movements;

      update public.user_accounts
      set balance_snapshot_amount = case when v_account.id = v_primary_id then v_amount else 0 end,
          balance_as_of_date = p_balance_date,
          balance = case when v_account.id = v_primary_id then v_amount else 0 end + v_delta
      where id = v_account.id;
    end loop;
  end loop;
end;
$$;

revoke all on function public.set_current_balances(date, numeric, numeric) from public;
grant execute on function public.set_current_balances(date, numeric, numeric) to authenticated;

-- Replaces only the authenticated user's expense rows for one day. Delete
-- and insert happen in one database transaction, so a failed save leaves the
-- previous daily report intact.
create or replace function public.sync_daily_expense_report(
  p_transaction_date date,
  p_items jsonb
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_transaction_id uuid;
  v_count int := 0;
  v_amount numeric;
  v_zero boolean;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'Items must be an array'; end if;
  if jsonb_array_length(p_items) > 100 then raise exception 'Too many items'; end if;

  delete from public.transactions
  where user_id = auth.uid()
    and transaction_type = 'expense'
    and transaction_date = p_transaction_date;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_amount := (v_item ->> 'amount')::numeric;
    v_zero := coalesce((v_item ->> 'isZeroConsumption')::boolean, false);
    if v_amount < 0 or (v_amount = 0 and not v_zero) then raise exception 'Invalid amount'; end if;

    if not exists (
      select 1 from public.user_accounts a
      where a.id = (v_item ->> 'accountId')::uuid
        and a.user_id = auth.uid() and a.is_active and a.type in ('cash', 'card', 'bank')
    ) then raise exception 'Invalid payment account'; end if;

    if not exists (
      select 1 from public.categories c
      where c.id = (v_item ->> 'categoryId')::uuid and c.type = 'expense'
        and c.is_active and (c.user_id is null or c.user_id = auth.uid())
    ) then raise exception 'Invalid category'; end if;

    insert into public.transactions (
      user_id, account_id, category_id, transaction_type, amount,
      transaction_date, is_zero_consumption, note, idempotency_key
    ) values (
      auth.uid(), (v_item ->> 'accountId')::uuid, (v_item ->> 'categoryId')::uuid,
      'expense', v_amount, p_transaction_date, v_zero,
      nullif(v_item ->> 'name', ''), nullif(v_item ->> 'idempotencyKey', '')
    ) returning id into v_transaction_id;

    insert into public.transaction_items (
      transaction_id, item_type, item_name, quantity, metadata
    ) values (
      v_transaction_id,
      coalesce(v_item ->> 'itemType', v_item ->> 'categoryId'),
      coalesce(nullif(v_item ->> 'name', ''), 'Chiqim'), 1,
      jsonb_build_object('paymentMethod', v_item ->> 'paymentMethod')
    );
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.sync_daily_expense_report(date, jsonb) from public;
grant execute on function public.sync_daily_expense_report(date, jsonb) to authenticated;

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
  with recursive category_roots as (
    select c.id, c.id as root_id, c.name as root_name, c.icon as root_icon
    from public.categories c where c.parent_id is null
    union all
    select c.id, cr.root_id, cr.root_name, cr.root_icon
    from public.categories c join category_roots cr on c.parent_id = cr.id
  ), totals as (
    select cr.root_id, cr.root_name, cr.root_icon, sum(t.amount) as total_amount
    from public.transactions t
    join category_roots cr on cr.id = t.category_id
    where t.user_id = auth.uid() and t.transaction_type = 'expense'
      and not t.is_zero_consumption
      and t.transaction_date between p_start_date and p_end_date
    group by cr.root_id, cr.root_name, cr.root_icon
  ), grand_total as (
    select coalesce(sum(total_amount), 0) as amount from totals
  )
  select t.root_id, t.root_name, t.root_icon, t.total_amount,
    case when g.amount > 0 then round(t.total_amount / g.amount * 100, 2) else 0 end
  from totals t cross join grand_total g
  order by t.total_amount desc limit greatest(p_limit, 0);
$$;

revoke all on function public.get_top_categories(date, date, int) from public;
grant execute on function public.get_top_categories(date, date, int) to authenticated;

create or replace function public.get_transaction_category_totals(
  p_transaction_type text default null,
  p_account_id uuid default null,
  p_category_id uuid default null,
  p_date_from date default null,
  p_date_to date default null,
  p_amount_min numeric default null,
  p_amount_max numeric default null,
  p_search text default null
)
returns table (
  category_id uuid,
  category_name text,
  category_icon text,
  total_amount numeric,
  transaction_count bigint
)
language sql
security invoker
stable
as $$
  with recursive category_roots as (
    select c.id, c.id as root_id, c.name as root_name, c.icon as root_icon
    from public.categories c where c.parent_id is null
    union all
    select c.id, cr.root_id, cr.root_name, cr.root_icon
    from public.categories c join category_roots cr on c.parent_id = cr.id
  )
  select cr.root_id, cr.root_name, cr.root_icon, sum(t.amount), count(*)
  from public.transactions t
  left join category_roots cr on cr.id = t.category_id
  where t.user_id = auth.uid()
    and (p_transaction_type is null or t.transaction_type = p_transaction_type)
    and (p_account_id is null or t.account_id = p_account_id)
    and (p_category_id is null or cr.root_id = p_category_id)
    and (p_date_from is null or t.transaction_date >= p_date_from)
    and (p_date_to is null or t.transaction_date <= p_date_to)
    and (p_amount_min is null or t.amount >= p_amount_min)
    and (p_amount_max is null or t.amount <= p_amount_max)
    and (p_search is null or coalesce(t.note, '') ilike '%' || p_search || '%')
  group by cr.root_id, cr.root_name, cr.root_icon
  order by sum(t.amount) desc;
$$;

revoke all on function public.get_transaction_category_totals(text, uuid, uuid, date, date, numeric, numeric, text) from public;
grant execute on function public.get_transaction_category_totals(text, uuid, uuid, date, date, numeric, numeric, text) to authenticated;

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
    select max(a.balance_as_of_date) as balance_date
    from public.user_accounts a
    where a.user_id = auth.uid() and a.is_active
  ), expense_days as (
    select t.transaction_date,
      sum(case when c.is_recurring and not t.is_zero_consumption then t.amount else 0 end) as recurring_amount
    from public.transactions t
    left join public.categories c on c.id = t.category_id
    cross join snapshot s
    where t.user_id = auth.uid() and t.transaction_type = 'expense'
      and (s.balance_date is null or t.transaction_date >= s.balance_date)
    group by t.transaction_date
  )
  select
    coalesce((select sum(a.balance) from public.user_accounts a where a.user_id = auth.uid() and a.is_active and a.type = 'cash'), 0),
    coalesce((select sum(a.balance) from public.user_accounts a where a.user_id = auth.uid() and a.is_active and a.type in ('card', 'bank')), 0),
    s.balance_date,
    coalesce((select sum(d.recurring_amount) from expense_days d), 0),
    (select count(*) from expense_days d)
  from snapshot s;
$$;

revoke all on function public.get_balance_forecast() from public;
grant execute on function public.get_balance_forecast() to authenticated;
