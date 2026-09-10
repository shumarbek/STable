import { notFound } from "next/navigation";
import { getWeeklyReportDetail } from "@/features/reports/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, formatPercentageChange } from "@/lib/calculations/money";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getWeeklyReportDetail(id);

  if (!detail) {
    notFound();
  }

  const { report, items, topCategoryName, topTransactionNote, topTransactionAmount } = detail;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {report.week_start} — {report.week_end}
        </h1>
        <p className="text-sm text-muted-foreground">Haftalik moliyaviy hisobot</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryStat label="Daromad" value={formatMoney(report.total_income)} tone="income" />
        <SummaryStat label="Xarajat" value={formatMoney(report.total_expense)} tone="expense" />
        <SummaryStat
          label="Sof oqim"
          value={formatMoney(report.net_cash_flow)}
          tone={report.net_cash_flow >= 0 ? "income" : "expense"}
        />
        <SummaryStat
          label="Kunlik o'rtacha xarajat"
          value={formatMoney(report.average_daily_expense)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">O&apos;tgan hafta bilan taqqoslash</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Oldingi hafta xarajati: {formatMoney(report.previous_week_expense ?? 0)}
          </p>
          <p
            className={
              (report.percentage_change ?? 0) > 0
                ? "mt-1 text-lg font-semibold text-expense"
                : "mt-1 text-lg font-semibold text-income"
            }
          >
            {formatPercentageChange(report.percentage_change)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kategoriya bo&apos;yicha xarajat</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">Ma&apos;lumot yo&apos;q</p>
          )}
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span>{item.category_name}</span>
              <span className="font-medium">
                {formatMoney(item.total_amount)}{" "}
                <span className="text-xs text-muted-foreground">
                  ({item.percentage.toFixed(1)}%)
                </span>
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Eng ko&apos;p xarajat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{topCategoryName ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Eng katta tranzaksiya</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {topTransactionNote ?? "Izohsiz"}
              {topTransactionAmount !== null && (
                <span className="ml-2 text-muted-foreground">
                  {formatMoney(topTransactionAmount)}
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "income" | "expense";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={
            tone === "income"
              ? "text-xl font-semibold text-income"
              : tone === "expense"
                ? "text-xl font-semibold text-expense"
                : "text-xl font-semibold"
          }
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
