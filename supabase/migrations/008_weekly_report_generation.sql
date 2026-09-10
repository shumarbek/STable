-- =====================================================================
-- 008_weekly_report_generation.sql
-- Server-side weekly report generation, callable by the Edge Function
-- (via service role) or by pg_cron directly. SECURITY DEFINER because
-- it must write to weekly_reports/report_items/notifications for ALL
-- users, and those tables have no client insert policy.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Generate (idempotently) the weekly report for one user for one week.
-- week_start MUST be a Monday. Returns the report id.
-- ---------------------------------------------------------------------
create or replace function public.generate_weekly_report_for_user(
  p_user_id uuid,
  p_week_start date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_end date := p_week_start + 6;
  v_report_id uuid;
  v_total_income numeric := 0;
  v_total_expense numeric := 0;
  v_transaction_count int := 0;
  v_top_category_id uuid;
  v_top_transaction_id uuid;
  v_prev_week_start date := p_week_start - 7;
  v_prev_week_end date := p_week_start - 1;
  v_previous_expense numeric := 0;
  v_percentage_change numeric;
  v_avg_daily numeric;
begin
  -- Idempotency: if a completed report already exists for this user+week, return it.
  select id into v_report_id
  from public.weekly_reports
  where user_id = p_user_id and week_start = p_week_start and status = 'completed';

  if v_report_id is not null then
    return v_report_id;
  end if;

  -- Upsert a pending/processing row (unique constraint prevents duplicates)
  insert into public.weekly_reports (user_id, week_start, week_end, status)
  values (p_user_id, p_week_start, v_week_end, 'processing')
  on conflict (user_id, week_start)
  do update set status = 'processing', error_message = null, updated_at = now()
  returning id into v_report_id;

  begin
    select
      coalesce(sum(case when transaction_type = 'income' then amount end), 0),
      coalesce(sum(case when transaction_type = 'expense' and not is_zero_consumption then amount end), 0),
      count(*)
    into v_total_income, v_total_expense, v_transaction_count
    from public.transactions
    where user_id = p_user_id
      and transaction_date between p_week_start and v_week_end;

    select category_id into v_top_category_id
    from public.transactions
    where user_id = p_user_id
      and transaction_type = 'expense' and not is_zero_consumption
      and transaction_date between p_week_start and v_week_end
      and category_id is not null
    group by category_id
    order by sum(amount) desc
    limit 1;

    select id into v_top_transaction_id
    from public.transactions
    where user_id = p_user_id
      and transaction_type = 'expense'
      and transaction_date between p_week_start and v_week_end
    order by amount desc
    limit 1;

    select coalesce(sum(amount), 0) into v_previous_expense
    from public.transactions
    where user_id = p_user_id
      and transaction_type = 'expense' and not is_zero_consumption
      and transaction_date between v_prev_week_start and v_prev_week_end;

    if v_previous_expense > 0 then
      v_percentage_change := round(((v_total_expense - v_previous_expense) / v_previous_expense) * 100, 2);
    else
      v_percentage_change := null;
    end if;

    v_avg_daily := round(v_total_expense / 7, 2);

    update public.weekly_reports
    set
      total_income = v_total_income,
      total_expense = v_total_expense,
      net_cash_flow = v_total_income - v_total_expense,
      average_daily_expense = v_avg_daily,
      transaction_count = v_transaction_count,
      top_category_id = v_top_category_id,
      top_transaction_id = v_top_transaction_id,
      previous_week_expense = v_previous_expense,
      percentage_change = v_percentage_change,
      status = 'completed',
      generated_at = now(),
      error_message = null
    where id = v_report_id;

    -- Category breakdown (report_items), replacing any partial previous attempt
    delete from public.report_items where report_id = v_report_id;

    insert into public.report_items (report_id, user_id, category_id, category_name, total_amount, percentage)
    select
      v_report_id,
      p_user_id,
      c.id,
      c.name,
      sum(t.amount),
      case when v_total_expense > 0 then round((sum(t.amount) / v_total_expense) * 100, 2) else 0 end
    from public.transactions t
    join public.categories c on c.id = t.category_id
    where t.user_id = p_user_id
      and t.transaction_type = 'expense' and not t.is_zero_consumption
      and t.transaction_date between p_week_start and v_week_end
    group by c.id, c.name
    order by sum(t.amount) desc;

    -- Notify the user
    insert into public.notifications (user_id, type, title, message, metadata)
    values (
      p_user_id,
      'weekly_report',
      'Haftalik hisobotingiz tayyor',
      format('%s - %s davri uchun moliyaviy hisobot tayyor.', p_week_start, v_week_end),
      jsonb_build_object('report_id', v_report_id, 'week_start', p_week_start, 'week_end', v_week_end)
    );

  exception when others then
    update public.weekly_reports
    set status = 'failed', error_message = sqlerrm
    where id = v_report_id;
    raise;
  end;

  return v_report_id;
end;
$$;

revoke all on function public.generate_weekly_report_for_user from public;
-- Only service_role should call this directly; authenticated users only
-- read weekly_reports via RLS SELECT policy, never call this generator.
grant execute on function public.generate_weekly_report_for_user to service_role;

-- ---------------------------------------------------------------------
-- Idempotent backfill: generate reports for ALL users for ALL completed
-- weeks that don't have a 'completed' report yet, up to p_max_weeks back.
-- This is what the cron job actually calls — it self-heals missed runs.
-- ---------------------------------------------------------------------
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
  v_current_week_start date := date_trunc('week', current_date)::date;
begin
  for v_user in select auth_user_id as user_id from public.profiles loop
    for i in 1..p_max_weeks loop
      v_week_start := v_current_week_start - (i * 7);

      if not exists (
        select 1 from public.weekly_reports
        where user_id = v_user.user_id and week_start = v_week_start and status = 'completed'
      ) then
        -- Only generate if the week is fully in the past (has ended).
        if v_week_start + 6 < current_date then
          perform public.generate_weekly_report_for_user(v_user.user_id, v_week_start);
          v_count := v_count + 1;
        end if;
      end if;
    end loop;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.run_weekly_report_backfill from public;
grant execute on function public.run_weekly_report_backfill to service_role;
