-- Balance conversion, correctly timed weekly reports, and consistent cash-flow analytics.

create or replace function public.convert_balance(
  p_direction text,
  p_amount numeric,
  p_conversion_date date,
  p_note text default null,
  p_idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cash public.user_accounts%rowtype;
  v_card public.user_accounts%rowtype;
  v_source public.user_accounts%rowtype;
  v_target public.user_accounts%rowtype;
  v_transaction_id uuid;
  v_local_today date;
  v_timezone text;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_direction not in ('cash_to_card', 'card_to_cash') then raise exception 'invalid_direction'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount'; end if;
  if p_note is not null and char_length(trim(p_note)) > 200 then raise exception 'note_too_long'; end if;

  select coalesce(timezone, 'Asia/Tashkent') into v_timezone
  from public.profiles where auth_user_id = v_uid;
  v_local_today := (now() at time zone coalesce(v_timezone, 'Asia/Tashkent'))::date;
  if p_conversion_date > v_local_today then raise exception 'conversion_date_in_future'; end if;

  -- Always lock in the same order to prevent opposite-direction deadlocks.
  select * into v_cash from public.user_accounts
  where user_id = v_uid and is_active and type = 'cash'
  order by created_at, id limit 1 for update;
  select * into v_card from public.user_accounts
  where user_id = v_uid and is_active and type in ('card', 'bank')
  order by created_at, id limit 1 for update;

  if v_cash.id is null or v_card.id is null then raise exception 'account_not_found'; end if;
  if p_direction = 'cash_to_card' then v_source := v_cash; v_target := v_card;
  else v_source := v_card; v_target := v_cash;
  end if;

  if p_conversion_date < greatest(v_source.balance_as_of_date, v_target.balance_as_of_date) then
    raise exception 'conversion_date_before_balance';
  end if;
  if v_source.balance < p_amount then raise exception 'insufficient_balance'; end if;

  if nullif(trim(p_idempotency_key), '') is not null then
    select id into v_transaction_id from public.transactions
    where user_id = v_uid and idempotency_key = trim(p_idempotency_key);
    if v_transaction_id is not null then return v_transaction_id; end if;
  end if;

  begin
    insert into public.transactions (
      user_id, account_id, transfer_account_id, transaction_type, amount,
      currency, transaction_date, note, idempotency_key
    ) values (
      v_uid, v_source.id, v_target.id, 'transfer', p_amount,
      v_source.currency, p_conversion_date,
      coalesce(nullif(trim(p_note), ''), 'Balans konvertatsiyasi'),
      nullif(trim(p_idempotency_key), '')
    ) returning id into v_transaction_id;
  exception when unique_violation then
    select id into v_transaction_id from public.transactions
    where user_id = v_uid and idempotency_key = trim(p_idempotency_key);
  end;

  return v_transaction_id;
end;
$$;

revoke all on function public.convert_balance(text, numeric, date, text, text) from public;
grant execute on function public.convert_balance(text, numeric, date, text, text) to authenticated;

create or replace function public.run_weekly_report_backfill(p_max_weeks int default 8)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user record;
  v_week_start date;
  v_count int := 0;
  v_local_today date := (now() at time zone 'Asia/Tashkent')::date;
  v_current_week_start date := date_trunc('week', (now() at time zone 'Asia/Tashkent'))::date;
begin
  for v_user in select auth_user_id as user_id from public.profiles loop
    for i in 1..greatest(1, least(p_max_weeks, 52)) loop
      v_week_start := v_current_week_start - (i * 7);
      if v_week_start + 6 < v_local_today and not exists (
        select 1 from public.weekly_reports
        where user_id = v_user.user_id and week_start = v_week_start and status = 'completed'
      ) then
        perform public.generate_weekly_report_for_user(v_user.user_id, v_week_start);
        v_count := v_count + 1;
      end if;
    end loop;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.run_weekly_report_backfill from public;
grant execute on function public.run_weekly_report_backfill to service_role;

do $$
declare v_jobid bigint;
begin
  for v_jobid in select jobid from cron.job where jobname = 'weekly-report-generation' loop
    perform cron.unschedule(v_jobid);
  end loop;
end;
$$;

-- Sunday 21:00 UTC is Monday 02:00 in Asia/Tashkent (UTC+5).
select cron.schedule(
  'weekly-report-generation',
  '0 21 * * 0',
  $$ select public.run_weekly_report_backfill(8); $$
);

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
    a.id,
    a.name,
    coalesce(sum(case
      when t.transaction_type in ('expense', 'loan')
        and not (t.transaction_type = 'expense' and t.is_zero_consumption)
      then t.amount end), 0),
    coalesce(sum(case
      when t.transaction_type in ('income', 'refund', 'debt_repayment')
      then t.amount end), 0)
  from public.user_accounts a
  left join public.transactions t
    on t.account_id = a.id
    and t.transaction_date between p_start_date and p_end_date
  where a.user_id = auth.uid()
  group by a.id, a.name
  having count(t.id) > 0
  order by 3 desc;
$$;

revoke all on function public.get_account_distribution from public;
grant execute on function public.get_account_distribution to authenticated;

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
  with settings as (
    select coalesce(
      (select timezone from public.profiles where auth_user_id = auth.uid()),
      'Asia/Tashkent'
    ) as user_timezone
  ), months as (
    select (
      date_trunc('month', now() at time zone settings.user_timezone)::date
      - (interval '1 month' * gs)
    )::date as month_start
    from settings, generate_series(0, greatest(1, least(p_months, 24)) - 1) as gs
  )
  select
    m.month_start,
    coalesce(sum(case
      when t.transaction_type in ('expense', 'loan')
        and not (t.transaction_type = 'expense' and t.is_zero_consumption)
      then t.amount end), 0),
    coalesce(sum(case
      when t.transaction_type in ('income', 'refund', 'debt_repayment')
      then t.amount end), 0)
  from months m
  left join public.transactions t
    on t.user_id = auth.uid()
    and date_trunc('month', t.transaction_date)::date = m.month_start
  group by m.month_start
  order by m.month_start;
$$;

revoke all on function public.get_monthly_trend from public;
grant execute on function public.get_monthly_trend to authenticated;

-- Repair any latest completed week that was skipped by the old UTC-date logic.
select public.run_weekly_report_backfill(8);
