"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/calculations/money";
import { uzMonthName } from "@/lib/calculations/date";
import type { MonthlyTrendRow } from "@/features/analytics/queries";

export function MonthlyTrendChart({ data }: { data: MonthlyTrendRow[] }) {
  const chartData = data.map((row) => {
    const d = new Date(`${row.month_start}T00:00:00`);
    return {
      ...row,
      label: uzMonthName(d.getMonth()).slice(0, 3),
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Oylik tendensiya</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
              <YAxis hide />
              <Tooltip
                formatter={(value) => formatMoney(Number(value ?? 0))}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                  fontSize: 12,
                }}
              />
              <Legend
                formatter={(value) => (value === "total_expense" ? "Xarajat" : "Daromad")}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="total_income" fill="var(--color-income)" radius={4} />
              <Bar dataKey="total_expense" fill="var(--color-expense)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
