/**
 * Hand-authored domain types for the STable schema, mirroring
 * supabase/migrations/*.sql. In a production workflow these would be
 * regenerated via `supabase gen types typescript` once the project is
 * linked; this file is a strict, dependency-free starting point so the
 * app compiles correctly against the real schema shape.
 */

export type TransactionType =
  | "expense"
  | "income"
  | "transfer"
  | "loan"
  | "debt_repayment"
  | "refund";

export type CategoryType = "expense" | "income" | "transfer";

export type AccountType = "cash" | "card" | "bank" | "ewallet" | "other";

export type BudgetPeriod = "weekly" | "monthly" | "yearly";

export type ReportStatus = "pending" | "processing" | "completed" | "failed";

export type NotificationType =
  | "weekly_report"
  | "budget_warning"
  | "subscription_due"
  | "goal_milestone"
  | "system";

export interface Profile {
  id: string;
  auth_user_id: string;
  public_user_id: string;
  full_name: string;
  university_name: string;
  faculty: string | null;
  course: string | null;
  avatar_url: string | null;
  timezone: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface UserAccount {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  parent_id: string | null;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  type: CategoryType;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  transfer_account_id: string | null;
  category_id: string | null;
  transaction_type: TransactionType;
  amount: number;
  currency: string;
  transaction_date: string;
  is_zero_consumption: boolean;
  note: string | null;
  location: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  item_type: string;
  item_name: string;
  quantity: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  amount_limit: number;
  period: BudgetPeriod;
  warning_threshold_percent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  provider_name: string;
  amount: number;
  billing_cycle: BudgetPeriod;
  next_billing_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeeklyReport {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  total_income: number;
  total_expense: number;
  net_cash_flow: number;
  average_daily_expense: number;
  transaction_count: number;
  top_category_id: string | null;
  top_transaction_id: string | null;
  previous_week_expense: number | null;
  percentage_change: number | null;
  status: ReportStatus;
  error_message: string | null;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportItem {
  id: string;
  report_id: string;
  user_id: string;
  category_id: string | null;
  category_name: string;
  total_amount: number;
  percentage: number;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

/**
 * Minimal Database type shape so @supabase/ssr generics compile. This is
 * intentionally loose (not a full generated Database type) — RPC and
 * table calls are given explicit generics at the call site.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
