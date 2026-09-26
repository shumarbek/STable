import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BalanceForm } from "@/features/accounts/BalanceForm";
import { getBalanceConversions, getBalanceEntries } from "@/features/accounts/queries";
import { BalanceForecastCard } from "@/features/dashboard/BalanceForecastCard";
import { getBalanceForecast } from "@/features/dashboard/queries";

export default async function BalancePage() {
  const [entries, conversions, forecast] = await Promise.all([getBalanceEntries(), getBalanceConversions(), getBalanceForecast()]);

  return <div className="mx-auto flex max-w-3xl flex-col gap-4">
    <div><h1 className="text-2xl font-semibold tracking-tight">Balans</h1><p className="text-sm text-muted-foreground">Mablag‘larni sana bo‘yicha qo‘shing va qoldiqni kuzating.</p></div>
    <Card><CardHeader><CardTitle className="text-base">Mablag‘ boshqaruvi</CardTitle><CardDescription>Yangi summa mavjud balansga qo‘shiladi. Naqd va karta o‘rtasida mablag‘ni konvertatsiya qilish mumkin.</CardDescription></CardHeader><CardContent><BalanceForm entries={entries} conversions={conversions} cashRemaining={forecast.cashBalance} cardRemaining={forecast.cardBalance} /></CardContent></Card>
    <BalanceForecastCard forecast={forecast} />
  </div>;
}
