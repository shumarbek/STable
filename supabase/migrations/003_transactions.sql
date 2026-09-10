-- =====================================================================
-- 003_transactions.sql
-- transactions, transaction_items, transaction_tags
-- Future-date rejection is enforced here at the database level.
-- =====================================================================

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.user_accounts(id) on delete restrict,
  transfer_account_id uuid null references public.user_accounts(id) on delete restrict,
  category_id uuid null references public.categories(id) on delete set null,
  transaction_type text not null,
  amount numeric(18,2) not null default 0,
  currency text not null default 'UZS',
  transaction_date date not null,
  is_zero_consumption boolean not null default false,
  note text null,
  location text null,
  idempotency_key text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint transactions_type_check check (
    transaction_type in ('expense', 'income', 'transfer', 'loan', 'debt_repayment', 'refund')
  ),
  constraint transactions_amount_nonnegative check (amount >= 0),
  -- Only "home-cooked meal" (amount = 0) records are allowed to be zero;
  -- application layer sets is_zero_consumption for those. Every other
  -- expense/income must be strictly positive to avoid meaningless rows.
  constraint transactions_amount_positive_unless_zero_consumption check (
    amount > 0 or is_zero_consumption = true
  ),
  constraint transactions_transfer_requires_target check (
    (transaction_type = 'transfer' and transfer_account_id is not null and transfer_account_id <> account_id)
    or (transaction_type <> 'transfer')
  ),
  constraint transactions_note_length check (note is null or char_length(note) <= 500),
  constraint transactions_location_length check (location is null or char_length(location) <= 200)
);

create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_date on public.transactions(transaction_date);
create index if not exists idx_transactions_category_id on public.transactions(category_id);
create index if not exists idx_transactions_account_id on public.transactions(account_id);
create index if not exists idx_transactions_type on public.transactions(transaction_type);
create index if not exists idx_transactions_user_date on public.transactions(user_id, transaction_date desc);

-- Prevent duplicate double-submits: same user + same idempotency_key can only exist once.
create unique index if not exists uq_transactions_idempotency
  on public.transactions (user_id, idempotency_key)
  where idempotency_key is not null;

create trigger trg_transactions_updated_at
  before update on public.transactions
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Enforce "no future date" at the database level, using the user's
-- profile timezone (falls back to Asia/Tashkent if profile missing).
-- ---------------------------------------------------------------------
create or replace function public.enforce_no_future_transaction_date()
returns trigger
language plpgsql
as $$
declare
  v_timezone text;
  v_today date;
begin
  select coalesce(p.timezone, 'Asia/Tashkent') into v_timezone
  from public.profiles p
  where p.auth_user_id = new.user_id;

  if v_timezone is null then
    v_timezone := 'Asia/Tashkent';
  end if;

  v_today := (now() at time zone v_timezone)::date;

  if new.transaction_date > v_today then
    raise exception 'transaction_date cannot be in the future (got %, today is %)', new.transaction_date, v_today
      using errcode = '22007';
  end if;

  return new;
end;
$$;

create trigger trg_transactions_no_future_date
  before insert or update on public.transactions
  for each row
  execute function public.enforce_no_future_transaction_date();

-- ---------------------------------------------------------------------
-- Keep user_accounts.balance in sync with transactions (income/expense/
-- transfer/loan/debt_repayment/refund all affect balance deterministically).
-- ---------------------------------------------------------------------
create or replace function public.apply_transaction_balance_delta(
  p_account_id uuid,
  p_delta numeric
)
returns void
language sql
as $$
  update public.user_accounts
  set balance = balance + p_delta
  where id = p_account_id;
$$;

create or replace function public.transactions_balance_effect()
returns trigger
language plpgsql
as $$
declare
  v_sign numeric;
begin
  -- Determine the sign of the effect on the primary account
  if (tg_op = 'INSERT') then
    if new.transaction_type in ('income', 'debt_repayment', 'refund') then
      v_sign := 1;
    elsif new.transaction_type in ('expense', 'loan') then
      v_sign := -1;
    elsif new.transaction_type = 'transfer' then
      v_sign := -1;
    else
      v_sign := 0;
    end if;

    if not (new.transaction_type = 'expense' and new.is_zero_consumption) then
      perform public.apply_transaction_balance_delta(new.account_id, v_sign * new.amount);
    end if;

    if new.transaction_type = 'transfer' and new.transfer_account_id is not null then
      perform public.apply_transaction_balance_delta(new.transfer_account_id, new.amount);
    end if;

    return new;
  elsif (tg_op = 'DELETE') then
    if old.transaction_type in ('income', 'debt_repayment', 'refund') then
      v_sign := -1;
    elsif old.transaction_type in ('expense', 'loan') then
      v_sign := 1;
    elsif old.transaction_type = 'transfer' then
      v_sign := 1;
    else
      v_sign := 0;
    end if;

    if not (old.transaction_type = 'expense' and old.is_zero_consumption) then
      perform public.apply_transaction_balance_delta(old.account_id, v_sign * old.amount);
    end if;

    if old.transaction_type = 'transfer' and old.transfer_account_id is not null then
      perform public.apply_transaction_balance_delta(old.transfer_account_id, -old.amount);
    end if;

    return old;
  end if;

  return null;
end;
$$;

-- For UPDATE we reverse the old effect then apply the new effect, handled by
-- deleting+inserting semantics via two triggers to keep logic simple and correct.
create trigger trg_transactions_balance_insert
  after insert on public.transactions
  for each row
  execute function public.transactions_balance_effect();

create trigger trg_transactions_balance_delete
  after delete on public.transactions
  for each row
  execute function public.transactions_balance_effect();

create or replace function public.transactions_balance_effect_update()
returns trigger
language plpgsql
as $$
begin
  -- Reverse old effect
  perform public.transactions_balance_effect_from_row(old, -1);
  -- Apply new effect
  perform public.transactions_balance_effect_from_row(new, 1);
  return new;
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
  if p_row.transaction_type in ('income', 'debt_repayment', 'refund') then
    v_sign := 1;
  elsif p_row.transaction_type in ('expense', 'loan') then
    v_sign := -1;
  elsif p_row.transaction_type = 'transfer' then
    v_sign := -1;
  else
    v_sign := 0;
  end if;

  if not (p_row.transaction_type = 'expense' and p_row.is_zero_consumption) then
    perform public.apply_transaction_balance_delta(p_row.account_id, p_direction * v_sign * p_row.amount);
  end if;

  if p_row.transaction_type = 'transfer' and p_row.transfer_account_id is not null then
    perform public.apply_transaction_balance_delta(p_row.transfer_account_id, p_direction * p_row.amount);
  end if;
end;
$$;

create trigger trg_transactions_balance_update
  after update on public.transactions
  for each row
  when (
    old.amount is distinct from new.amount
    or old.transaction_type is distinct from new.transaction_type
    or old.account_id is distinct from new.account_id
    or old.transfer_account_id is distinct from new.transfer_account_id
    or old.is_zero_consumption is distinct from new.is_zero_consumption
  )
  execute function public.transactions_balance_effect_update();

alter table public.transactions enable row level security;

create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on public.transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- transaction_items: multi-select items (e.g. multiple drinks in one txn)
-- ---------------------------------------------------------------------
create table if not exists public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  item_type text not null,
  item_name text not null,
  quantity numeric(10,2) not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint transaction_items_name_length check (char_length(trim(item_name)) between 1 and 100),
  constraint transaction_items_quantity_positive check (quantity > 0)
);

create index if not exists idx_transaction_items_transaction_id on public.transaction_items(transaction_id);

alter table public.transaction_items enable row level security;

create policy "transaction_items_select_own" on public.transaction_items
  for select using (
    exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid())
  );
create policy "transaction_items_insert_own" on public.transaction_items
  for insert with check (
    exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid())
  );
create policy "transaction_items_update_own" on public.transaction_items
  for update using (
    exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid())
  );
create policy "transaction_items_delete_own" on public.transaction_items
  for delete using (
    exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- transaction_tags: many-to-many
-- ---------------------------------------------------------------------
create table if not exists public.transaction_tags (
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (transaction_id, tag_id)
);

alter table public.transaction_tags enable row level security;

create policy "transaction_tags_select_own" on public.transaction_tags
  for select using (
    exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid())
  );
create policy "transaction_tags_insert_own" on public.transaction_tags
  for insert with check (
    exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid())
    and exists (select 1 from public.tags tg where tg.id = tag_id and tg.user_id = auth.uid())
  );
create policy "transaction_tags_delete_own" on public.transaction_tags
  for delete using (
    exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid())
  );
