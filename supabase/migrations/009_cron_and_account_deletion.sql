-- =====================================================================
-- 009_cron_and_account_deletion.sql
-- pg_cron scheduling for weekly reports + secure account deletion RPC.
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ---------------------------------------------------------------------
-- Schedule: every Monday at 00:05 Asia/Tashkent time.
-- Asia/Tashkent is UTC+5 with no DST, so 00:05 local = 19:05 UTC the
-- previous day (Sunday). Cron expressions run in UTC on Supabase, so:
--   '05 19 * * 0'  ->  Sunday 19:05 UTC == Monday 00:05 Asia/Tashkent
-- ---------------------------------------------------------------------
select cron.schedule(
  'weekly-report-generation',
  '5 19 * * 0',
  $$ select public.run_weekly_report_backfill(8); $$
);

comment on extension pg_cron is 'Used to trigger weekly financial report generation (see job weekly-report-generation).';

-- ---------------------------------------------------------------------
-- Secure account deletion.
-- Deletes all user-owned data. auth.users row itself must be deleted by
-- the "delete-account" Edge Function using the service-role admin API
-- (auth.admin.deleteUser), because a SQL function cannot remove Auth
-- identities/sessions directly. This RPC handles all `public` schema
-- data with a security definer to guarantee full cleanup regardless of
-- FK on delete behavior differences.
-- ---------------------------------------------------------------------
create or replace function public.delete_own_account_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.notifications where user_id = v_uid;
  delete from public.report_items where user_id = v_uid;
  delete from public.weekly_reports where user_id = v_uid;
  delete from public.subscriptions where user_id = v_uid;
  delete from public.goals where user_id = v_uid;
  delete from public.budget_periods where user_id = v_uid;
  delete from public.budgets where user_id = v_uid;
  delete from public.transaction_tags where transaction_id in (select id from public.transactions where user_id = v_uid);
  delete from public.transaction_items where transaction_id in (select id from public.transactions where user_id = v_uid);
  delete from public.transactions where user_id = v_uid;
  delete from public.tags where user_id = v_uid;
  delete from public.categories where user_id = v_uid; -- custom categories only
  delete from public.user_accounts where user_id = v_uid;
  delete from public.profiles where auth_user_id = v_uid;
end;
$$;

revoke all on function public.delete_own_account_data from public;
grant execute on function public.delete_own_account_data to authenticated;
