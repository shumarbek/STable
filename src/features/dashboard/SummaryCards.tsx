import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/calculations/money";
import type { DashboardSummary } from "@/features/dashboard/queries";

export function SummaryCards({
  summary,
  currency,
}: {
  summary: DashboardSummary | null;
  currency: string;
}) {
  const s = summary ?? {
    today_expense: 0,
    today_income: 0,
    today_transaction_count: 0,
    week_expense: 0,
    week_income: 0,
    week_avg_daily_expense: 0,
    month_expense: 0,
    month_income: 0,
    month_avg_daily_expense: 0,
    current_balance: 0,
  };

  const netThisMonth = s.month_income - s.month_expense;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Joriy balans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tracking-tight">
            {formatMoney(s.current_balance, currency)}
          </p>
        </CardContent>
      </Card>

      <StatCard
        label="Bugungi xarajat"
        value={formatMoney(s.today_expense, currency)}
        tone="expense"
        sub={`${s.today_transaction_count} ta tranzaksiya`}
      />
      <StatCard
        label="Shu hafta xarajat"
        value={formatMoney(s.week_expense, currency)}
        tone="expense"
        sub={`kuniga o'rtacha ${formatMoney(s.week_avg_daily_expense, currency)}`}
      />
      <StatCard
        label="Shu oy xarajat"
        value={formatMoney(s.month_expense, currency)}
        tone="expense"
        sub={`kuniga o'rtacha ${formatMoney(s.month_avg_daily_expense, currency)}`}
      />
      <StatCard
        label="Shu oy sof oqim"
        value={formatMoney(netThisMonth, currency)}
        tone={netThisMonth >= 0 ? "income" : "expense"}
        sub={`daromad ${formatMoney(s.month_income, currency)}`}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "income" | "expense";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={
            tone === "income"
              ? "text-xl font-semibold text-income"
              : "text-xl font-semibold text-foreground"
          }
        >
          {value}
        </p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
