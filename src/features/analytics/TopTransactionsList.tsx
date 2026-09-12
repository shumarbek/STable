import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/calculations/money";
import type { TopTransactionRow } from "@/features/analytics/queries";

export function TopTransactionsList({ transactions }: { transactions: TopTransactionRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Eng katta chiqimlar</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {transactions.length === 0 && (
          <p className="text-sm text-muted-foreground">Ma&apos;lumot yo&apos;q</p>
        )}
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center justify-between text-sm">
            <div>
              <p>{t.category_name ?? "Kategoriyasiz"}</p>
              <p className="text-xs text-muted-foreground">{t.note || t.transaction_date}</p>
            </div>
            <span className="font-medium">{formatMoney(t.amount)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
