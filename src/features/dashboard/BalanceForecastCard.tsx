import { CalendarClock, Gauge, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/calculations/money";
import type { BalanceForecast } from "@/features/dashboard/queries";

export function BalanceForecastCard({ forecast }: { forecast: BalanceForecast }) {
  return <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-card to-primary/[0.04]">
    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Gauge className="size-5 text-primary" />Balans yetarliligi</CardTitle></CardHeader>
    <CardContent className="grid gap-4 sm:grid-cols-3">
      <Stat icon={WalletCards} label="Mavjud balans" value={formatMoney(forecast.totalBalance)} />
      <Stat icon={CalendarClock} label="Kunlik o‘rtacha muntazam chiqim" value={formatMoney(forecast.averageDailyRecurringExpense)} />
      <Stat icon={Gauge} label="Taxminiy yetish muddati" value={forecast.estimatedDaysLeft === null ? "Ma’lumot yetarli emas" : `${forecast.estimatedDaysLeft} kun`} />
      <p className="text-xs text-muted-foreground sm:col-span-3">Hisob {forecast.balanceDate ? `${forecast.balanceDate} sanasidan boshlab ` : ""}chiqim kiritilgan {forecast.reportDayCount} kun asosida olinadi. Ta’mir, qurilma, sayohat va sovg‘a kabi bir martalik sarflar o‘rtachaga kiritilmaydi.</p>
    </CardContent>
  </Card>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof WalletCards; label: string; value: string }) {
  return <div className="rounded-xl border bg-background/70 p-3"><Icon className="mb-2 size-4 text-primary" /><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold tabular-nums">{value}</p></div>;
}
