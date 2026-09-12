import Link from "next/link";
import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTransactionsList } from "@/features/transactions/queries";
import { TransactionRow } from "@/features/transactions/TransactionRow";
import { TransactionsFilterBar } from "@/features/transactions/TransactionsFilterBar";
import { getActiveAccounts } from "@/features/accounts/queries";
import { getFlatCategories } from "@/features/categories/queries";
import type { TransactionType } from "@/types/database";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;

  const [{ rows, totalCount }, accounts, categories] = await Promise.all([
    getTransactionsList({
      search: params.search,
      categoryId: params.categoryId,
      accountId: params.accountId,
      transactionType: params.type as TransactionType | undefined,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      sort: params.sort as "newest" | "oldest" | "amount_desc" | "amount_asc" | undefined,
      page,
      pageSize: 20,
    }),
    getActiveAccounts(),
    getFlatCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / 20));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Kirim va chiqimlar</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Jadval faylini yuklab olish"
            render={
              <a href="/api/transactions/export" download>
                <Download className="size-4" />
              </a>
            }
          />
          <Button
            className="hidden gap-2 sm:inline-flex"
            render={
              <Link href="/transactions/new">
                <Plus className="size-4" />
                Qo&apos;shish
              </Link>
            }
          />
        </div>
      </div>

      <TransactionsFilterBar accounts={accounts} categories={categories} />

      <Card>
        <CardContent className="flex flex-col gap-1 p-2">
          {rows.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Hech qanday kirim yoki chiqim topilmadi.
            </p>
          )}
          {rows.map((row) => (
            <TransactionRow key={row.id} row={row} />
          ))}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              render={
                <Link
                  href={{
                    pathname: "/transactions",
                    query: { ...params, page: p },
                  }}
                >
                  {p}
                </Link>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
