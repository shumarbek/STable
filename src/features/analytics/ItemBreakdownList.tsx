import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/calculations/money";
import type { ItemBreakdownRow } from "@/features/analytics/queries";

export function ItemBreakdownList({ items }: { items: ItemBreakdownRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Itemlar bo&apos;yicha xarajat</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Hali qo&apos;shimcha item (ichimlik va h.k.) kiritilmagan.
          </p>
        )}
        {items.map((item) => (
          <div key={item.item_name} className="flex items-center justify-between text-sm">
            <span>
              {item.item_name}{" "}
              <span className="text-xs text-muted-foreground">×{item.occurrence_count}</span>
            </span>
            <span className="font-medium">{formatMoney(item.total_amount)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
