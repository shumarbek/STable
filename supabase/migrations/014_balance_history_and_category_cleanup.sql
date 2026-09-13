-- =====================================================================
-- 014_balance_history_and_category_cleanup.sql
-- Additive balance history and the refined Shopping taxonomy.
-- =====================================================================

update public.categories
set is_active = false
where user_id is null and slug = 'shopping-dishwashing';

update public.categories
set name = 'Tozalik va gigiyena vositalari',
    icon = 'sparkles', sort_order = 1, is_recurring = true, is_active = true
where user_id is null and slug = 'shopping-hygiene';

do $$
declare
  v_parent uuid;
  v_id uuid;
begin
  select id into v_parent from public.categories
  where user_id is null and slug = 'shopping' limit 1;

  select id into v_id from public.categories
  where user_id is null and slug = 'shopping-household' limit 1;

  if v_id is null then
    insert into public.categories (
      user_id, parent_id, name, slug, icon, type, is_default,
      is_active, sort_order, is_recurring
    ) values (
      null, v_parent, 'Ro‘zg‘orlik', 'shopping-household', 'house',
      'expense', true, true, 2, true
    );
  else
    update public.categories
    set parent_id = v_parent, name = 'Ro‘zg‘orlik', icon = 'house',
        type = 'expense', is_default = true, is_active = true,
        sort_order = 2, is_recurring = true
    where id = v_id;
  end if;

  update public.categories set sort_order = 3
  where user_id is null and slug = 'shopping-tobacco';
  update public.categories set sort_order = 4
  where user_id is null and slug = 'shopping-equipment';
end;
$$;

create table if not exists public.balance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  cash_amount numeric(18,2) not null default 0,
  card_amount numeric(18,2) not null default 0,
  note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint balance_entries_nonnegative check (cash_amount >= 0 and card_amount >= 0),
  constraint balance_entries_nonempty check (cash_amount > 0 or card_amount > 0),
  constraint balance_entries_note_length check (note is null or char_length(note) <= 200)
);

create index if not exists idx_balance_entries_user_date
  on public.balance_entries(user_id, entry_date desc, created_at desc);

create trigger trg_balance_entries_updated_at
  before update on public.balance_entries
  for each row execute function public.set_updated_at();

alter table public.balance_entries enable row level security;

create policy "balance_entries_select_own" on public.balance_entries
  for select using (auth.uid() = user_id);
create policy "balance_entries_insert_own" on public.balance_entries
  for insert with check (auth.uid() = user_id);
create policy "balance_entries_update_own" on public.balance_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Preserve the balance snapshot users already entered as the first history row.
insert into public.balance_entries (user_id, entry_date, cash_amount, card_amount, note)
select a.user_id,
       min(a.balance_as_of_date),
       coalesce(sum(a.balance_snapshot_amount) filter (where a.type = 'cash'), 0),
       coalesce(sum(a.balance_snapshot_amount) filter (where a.type in ('card', 'bank')), 0),
       'Boshlang‘ich balans'
from public.user_accounts a
where a.is_active
group by a.user_id
having coalesce(sum(a.balance_snapshot_amount), 0) > 0;

create or replace function public.save_balance_entry(
  p_entry_id uuid,
  p_entry_date date,
  p_cash_amount numeric,
  p_card_amount numeric,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry public.balance_entries;
  v_result_id uuid;
  v_cash_delta numeric;
  v_card_delta numeric;
  v_timezone text;
  v_today date;
  v_account_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_cash_amount < 0 or p_card_amount < 0 or p_cash_amount + p_card_amount <= 0 then
    raise exception 'Invalid balance entry';
  end if;

  select coalesce(p.timezone, 'Asia/Tashkent') into v_timezone
  from public.profiles p where p.auth_user_id = auth.uid();
  v_today := (now() at time zone coalesce(v_timezone, 'Asia/Tashkent'))::date;
  if p_entry_date > v_today then raise exception 'Entry date cannot be in the future'; end if;

  if p_entry_id is null then
    insert into public.balance_entries (user_id, entry_date, cash_amount, card_amount, note)
    values (auth.uid(), p_entry_date, p_cash_amount, p_card_amount, nullif(trim(p_note), ''))
    returning id into v_result_id;
    v_cash_delta := p_cash_amount;
    v_card_delta := p_card_amount;
  else
    select * into v_entry from public.balance_entries
    where id = p_entry_id and user_id = auth.uid() for update;
    if v_entry.id is null then raise exception 'Balance entry not found'; end if;

    update public.balance_entries
    set entry_date = p_entry_date, cash_amount = p_cash_amount,
        card_amount = p_card_amount, note = nullif(trim(p_note), '')
    where id = p_entry_id;
    v_result_id := p_entry_id;
    v_cash_delta := p_cash_amount - v_entry.cash_amount;
    v_card_delta := p_card_amount - v_entry.card_amount;
  end if;

  select id into v_account_id from public.user_accounts
  where user_id = auth.uid() and is_active and type = 'cash'
  order by created_at, id limit 1;
  if v_account_id is null then
    insert into public.user_accounts (
      user_id, name, type, balance, balance_snapshot_amount, balance_as_of_date, currency
    ) values (auth.uid(), 'Naqd', 'cash', 0, 0, p_entry_date, 'UZS')
    returning id into v_account_id;
  end if;
  update public.user_accounts set balance = balance + v_cash_delta where id = v_account_id;

  v_account_id := null;
  select id into v_account_id from public.user_accounts
  where user_id = auth.uid() and is_active and type in ('card', 'bank')
  order by created_at, id limit 1;
  if v_account_id is null then
    insert into public.user_accounts (
      user_id, name, type, balance, balance_snapshot_amount, balance_as_of_date, currency
    ) values (auth.uid(), 'Karta', 'card', 0, 0, p_entry_date, 'UZS')
    returning id into v_account_id;
  end if;
  update public.user_accounts set balance = balance + v_card_delta where id = v_account_id;

  return v_result_id;
end;
$$;

revoke all on function public.save_balance_entry(uuid, date, numeric, numeric, text) from public;
grant execute on function public.save_balance_entry(uuid, date, numeric, numeric, text) to authenticated;

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
  )
  select
    coalesce((select sum(a.balance) from public.user_accounts a where a.user_id = auth.uid() and a.is_active and a.type = 'cash'), 0),
    coalesce((select sum(a.balance) from public.user_accounts a where a.user_id = auth.uid() and a.is_active and a.type in ('card', 'bank')), 0),
    s.balance_date,
    coalesce((select sum(d.recurring_amount) from expense_days d), 0),
    (select count(*) from expense_days d)
  from snapshot s;
$$;
