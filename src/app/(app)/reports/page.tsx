import Link from "next/link";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getWeeklyReports } from "@/features/reports/queries";
import { formatMoney, formatPercentageChange } from "@/lib/calculations/money";

const statusLabels: Record<string, string> = {
  pending: "Kutilmoqda",
  processing: "Tayyorlanmoqda",
  completed: "Tayyor",
  failed: "Xatolik",
};

export default async function ReportsPage() {
  const reports = await getWeeklyReports();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Haftalik hisobotlar</h1>

      {reports.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Hali hisobotlar yo&apos;q. Birinchi haftalik hisobot dushanba kuni
              tayyor bo&apos;ladi.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {reports.map((report) => (
          <Link key={report.id} href={`/reports/${report.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">
                    {report.week_start} — {report.week_end}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {report.transaction_count} ta tranzaksiya
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {report.status === "completed" ? (
                    <>
                      <span className="text-sm font-medium">
                        {formatMoney(report.total_expense)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatPercentageChange(report.percentage_change)}
                      </span>
                    </>
                  ) : (
                    <Badge variant={report.status === "failed" ? "destructive" : "secondary"}>
                      {statusLabels[report.status] ?? report.status}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
