"use client";

import { useState, useTransition } from "react";
import { Banknote, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveCurrentBalances } from "@/features/accounts/actions";
import { DatePickerField } from "@/features/transactions/DatePickerField";
import { toIsoDate } from "@/lib/calculations/date";
import { useRouter } from "next/navigation";

export function BalanceForm({ cash, card, balanceDate }: { cash: number; card: number; balanceDate?: string }) {
  const [cashBalance, setCashBalance] = useState(String(cash));
  const [cardBalance, setCardBalance] = useState(String(card));
  const [date, setDate] = useState(balanceDate ?? toIsoDate(new Date()));
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return <form className="grid gap-4" onSubmit={(event) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveCurrentBalances({ cashBalance, cardBalance, balanceDate: date });
      if ("error" in result) toast.error(result.error); else {
        toast.success("Balans va uning sanasi saqlandi");
        router.refresh();
      }
    });
  }}>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2 rounded-2xl border p-4"><Label htmlFor="cash-balance" className="flex items-center gap-2"><Banknote className="size-4 text-emerald-600" />Naqd pul</Label><div className="flex items-center gap-2"><Input id="cash-balance" type="number" min={0} step={100} inputMode="numeric" value={cashBalance} onChange={(event) => setCashBalance(event.target.value)} className="text-lg font-semibold" required /><span className="text-sm text-muted-foreground">so‘m</span></div></div>
      <div className="grid gap-2 rounded-2xl border p-4"><Label htmlFor="card-balance" className="flex items-center gap-2"><CreditCard className="size-4 text-blue-600" />Kartadagi pul</Label><div className="flex items-center gap-2"><Input id="card-balance" type="number" min={0} step={100} inputMode="numeric" value={cardBalance} onChange={(event) => setCardBalance(event.target.value)} className="text-lg font-semibold" required /><span className="text-sm text-muted-foreground">so‘m</span></div></div>
    </div>
    <div className="grid gap-2 rounded-2xl border p-4">
      <Label>Balans mavjud bo‘lgan sana</Label>
      <DatePickerField value={date} onChange={setDate} />
      <p className="text-xs text-muted-foreground">Kiritilgan summa shu kun boshidagi mablag‘ sifatida olinadi. Keyingi kirim va chiqimlar avtomatik hisoblanadi.</p>
    </div>
    <Button type="submit" className="h-11" disabled={isPending}>{isPending && <Loader2 className="size-4 animate-spin" />}Balansni saqlash</Button>
  </form>;
}
