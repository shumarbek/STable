"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "cn";
import { formatMoney } from "@/lib/calculations/money";
import { uzWeekdayShort } from "@/lib/calculations/date";
import type { DailyTrendRow } from "@/features/dashboard/queries";

export function TrendChartCard({
  trend,
  className,
}: {
  trend: DailyTrendRow[];
  className?: string;
}) {
  const data = trend.map((row) => ({
    ...row,
    label: uzWeekdayShort(row.day),
  }));

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base">Kunlik xarajat tendensiyasi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-expense)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-expense)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                className="text-xs fill-muted-foreground"
              />
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
              <Area
                type="monotone"
                dataKey="total_expense"
                stroke="var(--color-expense)"
                strokeWidth={2}
                fill="url(#expenseFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
