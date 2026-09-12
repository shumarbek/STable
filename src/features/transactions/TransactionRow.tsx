import Link from "next/link";
import { formatMoney } from "@/lib/calculations/money";
import type { TransactionListRow } from "@/features/transactions/queries";
import { CategoryIcon } from "@/features/categories/CategoryIcon";

const typeSign: Record<string, "+" | "-" | ""> = {
  income: "+",
  refund: "+",
  debt_repayment: "+",
  expense: "-",
  loan: "-",
  transfer: "",
};

export function TransactionRow({ row }: { row: TransactionListRow }) {
  const sign = typeSign[row.transaction_type] ?? "";
  const tone =
    sign === "+" ? "text-income" : sign === "-" ? "text-foreground" : "text-info";

  return (
    <Link
      href={`/transactions/${row.id}`}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-base">
        <CategoryIcon icon={row.category?.icon} className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {row.category?.name ?? "Kategoriyasiz"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {row.account?.name} • {row.transaction_date}
        </p>
      </div>
      <p className={`shrink-0 text-sm font-medium ${tone}`}>
        {sign}
        {formatMoney(row.amount)}
      </p>
    </Link>
  );
}
