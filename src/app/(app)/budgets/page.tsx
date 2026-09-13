import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BalanceForm } from "@/features/accounts/BalanceForm";
import { getActiveAccounts } from "@/features/accounts/queries";
import { BalanceForecastCard } from "@/features/dashboard/BalanceForecastCard";
import { getBalanceForecast } from "@/features/dashboard/queries";

export default async function BalancePage() {
  const [accounts, forecast] = await Promise.all([getActiveAccounts(), getBalanceForecast()]);
  const cash = accounts.filter((account) => account.type === "cash").reduce((sum, account) => sum + Number(account.balance_snapshot_amount ?? account.balance), 0);
  const card = accounts.filter((account) => account.type === "card" || account.type === "bank").reduce((sum, account) => sum + Number(account.balance_snapshot_amount ?? account.balance), 0);
  const balanceDate = accounts.map((account) => account.balance_as_of_date).filter(Boolean).sort().at(-1);

  return <div className="mx-auto flex max-w-3xl flex-col gap-4">
    <div><h1 className="text-2xl font-semibold tracking-tight">Mavjud balans</h1><p className="text-sm text-muted-foreground">Hozir qo‘lingizdagi naqd va kartadagi mablag‘ni kiriting.</p></div>
    <Card><CardHeader><CardTitle className="text-base">Joriy mablag‘</CardTitle><CardDescription>Bu rejalashtirilgan budjet emas — tanlangan sanadagi haqiqiy pulingiz.</CardDescription></CardHeader><CardContent><BalanceForm cash={cash} card={card} balanceDate={balanceDate} /></CardContent></Card>
    <BalanceForecastCard forecast={forecast} />
  </div>;
}
