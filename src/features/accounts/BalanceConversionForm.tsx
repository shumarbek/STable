"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Banknote, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertBalance } from "@/features/accounts/actions";
import { DatePickerField } from "@/features/transactions/DatePickerField";
import { toIsoDate } from "@/lib/calculations/date";
import { formatMoney } from "@/lib/calculations/money";
import type { BalanceConversion } from "@/types/database";

type Direction = "cash_to_card" | "card_to_cash";

export function BalanceConversionForm({ conversions, cashRemaining, cardRemaining }: {
  conversions: BalanceConversion[];
  cashRemaining: number;
  cardRemaining: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [direction, setDirection] = useState<Direction>("cash_to_card");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toIsoDate(new Date()));
  const [note, setNote] = useState("");
  const available = direction === "cash_to_card" ? cashRemaining : cardRemaining;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await convertBalance({
        direction,
        amount: Number(amount),
        conversionDate: date,
        note,
        idempotencyKey: crypto.randomUUID(),
      });
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Mablag‘ muvaffaqiyatli konvertatsiya qilindi");
      setAmount("");
      setNote("");
      router.refresh();
    });
  }

  return <section className="grid gap-4 rounded-2xl border bg-muted/20 p-4">
    <div><h2 className="font-semibold">Mablag‘ni konvertatsiya qilish</h2><p className="text-xs text-muted-foreground">Naqd va karta o‘rtasida ichki mablag‘ o‘tkazing. Umumiy balans o‘zgarmaydi.</p></div>
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Konvertatsiya yo‘nalishi">
      <Button type="button" variant={direction === "cash_to_card" ? "default" : "outline"} className="h-auto min-h-12 whitespace-normal" onClick={() => setDirection("cash_to_card")}><Banknote className="size-4" />Naqddan kartaga</Button>
      <Button type="button" variant={direction === "card_to_cash" ? "default" : "outline"} className="h-auto min-h-12 whitespace-normal" onClick={() => setDirection("card_to_cash")}><CreditCard className="size-4" />Kartadan naqdga</Button>
    </div>
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2"><Label htmlFor="conversion-amount">Konvertatsiya summasi</Label><div className="flex items-center gap-2"><Input id="conversion-amount" type="number" min={1} step={1} inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" required /><span className="text-sm text-muted-foreground">so‘m</span></div><p className={Number(amount) > available ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{Number(amount) > available ? "Tanlangan hisobda mablag‘ yetarli emas." : `Mavjud: ${formatMoney(available)}`}</p></div>
      <div className="grid gap-2"><Label>Konvertatsiya sanasi</Label><DatePickerField value={date} onChange={setDate} /></div>
      <div className="grid gap-2"><Label htmlFor="conversion-note">Izoh (ixtiyoriy)</Label><Input id="conversion-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={200} placeholder="Masalan: kartani to‘ldirish" /></div>
      <Button type="submit" className="h-11" disabled={isPending || Number(amount) <= 0 || Number(amount) > available}>{isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowLeftRight className="size-4" />}Konvertatsiya qilish</Button>
    </form>
    <div className="grid gap-2">
      <h3 className="text-sm font-semibold">So‘nggi konvertatsiyalar</h3>
      {conversions.length === 0 ? <p className="rounded-xl border border-dashed py-5 text-center text-xs text-muted-foreground">Hali konvertatsiya qilinmagan.</p> : conversions.slice(0, 10).map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border bg-background p-3">
        <ArrowLeftRight className="size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.source_name} → {item.target_name}</p><p className="truncate text-xs text-muted-foreground">{item.transaction_date} · {item.note || "Balans konvertatsiyasi"}</p></div>
        <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(item.amount)}</p>
      </div>)}
    </div>
  </section>;
}
