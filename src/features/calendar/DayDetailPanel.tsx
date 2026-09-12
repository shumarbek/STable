"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/calculations/money";
import { uzMonthName } from "@/lib/calculations/date";
import { CategoryIcon } from "@/features/categories/CategoryIcon";

interface DayTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  note: string | null;
  is_zero_consumption: boolean;
  category: { name: string; icon: string | null } | null;
}

export function DayDetailPanel({ day }: { day: string }) {
  // Keying by `day` makes React remount this subtree whenever the
  // selected day changes, which naturally resets `transactions` to
  // `null` (initial state) instead of requiring a manual setState
  // call inside the fetch effect.
  return <DayDetailPanelInner key={day} day={day} />;
}

function DayDetailPanelInner({ day }: { day: string }) {
  const [transactions, setTransactions] = useState<DayTransaction[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/calendar/day?day=${day}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setTransactions(data.transactions ?? []);
      })
      .catch(() => {
        if (!cancelled) setTransactions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [day]);

  const [year, month, dayNum] = day.split("-").map(Number);

  const totalExpense =
    transactions
      ?.filter((t) => t.transaction_type === "expense" && !t.is_zero_consumption)
      .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;
  const totalIncome =
    transactions
      ?.filter((t) => t.transaction_type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {dayNum} {uzMonthName(month - 1)} {year}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Jami chiqim: {formatMoney(totalExpense)} • Jami kirim:{" "}
          {formatMoney(totalIncome)}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {transactions === null &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        {transactions?.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Bu kunda amal yo&apos;q.
          </p>
        )}
        {transactions?.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg px-2 py-2">
            <div className="flex items-center gap-2">
              <CategoryIcon icon={t.category?.icon} className="size-4" />
              <span className="text-sm">{t.category?.name ?? "Kategoriyasiz"}</span>
            </div>
            <span className="text-sm font-medium">{formatMoney(t.amount)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
