import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/calculations/money";
import type { TopCategoryRow } from "@/features/dashboard/queries";

export function TopCategoriesCard({ categories }: { categories: TopCategoryRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top kategoriyalar</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Bu oy uchun xarajat ma&apos;lumotlari yo&apos;q.
          </p>
        )}
        {categories.map((cat) => (
          <div key={cat.category_id} className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-base">
              {cat.category_icon ?? "💳"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{cat.category_name}</p>
                <p className="shrink-0 text-sm font-medium">
                  {formatMoney(cat.total_amount)}
                </p>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
