"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, Loader2, Pencil, Plus, WalletCards, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerField } from "@/features/transactions/DatePickerField";
import { saveBalanceEntry } from "@/features/accounts/actions";
import { toIsoDate } from "@/lib/calculations/date";
import { formatMoney } from "@/lib/calculations/money";
import type { BalanceEntry } from "@/types/database";

export function BalanceForm({ entries, cashRemaining, cardRemaining }: {
  entries: BalanceEntry[];
  cashRemaining: number;
  cardRemaining: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cash, setCash] = useState("");
  const [card, setCard] = useState("");
  const [date, setDate] = useState(toIsoDate(new Date()));
  const [note, setNote] = useState("");

  function reset() {
    setEditingId(null); setCash(""); setCard(""); setDate(toIsoDate(new Date())); setNote("");
  }

  function edit(entry: BalanceEntry) {
    setEditingId(entry.id);
    setCash(String(entry.cash_amount));
    setCard(String(entry.card_amount));
    setDate(entry.entry_date);
    setNote(entry.note ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveBalanceEntry({
        entryId: editingId,
        cashBalance: Number(cash || 0),
        cardBalance: Number(card || 0),
        balanceDate: date,
        note,
      });
      if ("error" in result) { toast.error(result.error); return; }
      toast.success(editingId ? "Mablag‘ yozuvi yangilandi" : "Mablag‘ balansga qo‘shildi");
      reset();
      router.refresh();
    });
  }

  return <div className="grid gap-5">
    <div className="grid gap-3 sm:grid-cols-3">
      <BalanceStat icon={Banknote} label="Naqd qoldiq" value={cashRemaining} tone="text-emerald-600" />
      <BalanceStat icon={CreditCard} label="Karta qoldig‘i" value={cardRemaining} tone="text-blue-600" />
      <BalanceStat icon={WalletCards} label="Umumiy qoldiq" value={cashRemaining + cardRemaining} tone="text-primary" />
    </div>

    <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="font-semibold">{editingId ? "Mablag‘ yozuvini tahrirlash" : "Mablag‘ qo‘shish"}</h2><p className="text-xs text-muted-foreground">Summa mavjud balansga qo‘shiladi.</p></div>
        {editingId && <Button type="button" variant="ghost" size="sm" onClick={reset}><X className="size-4" />Bekor qilish</Button>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2"><Label htmlFor="cash-balance">Naqd qo‘shiladi</Label><div className="flex items-center gap-2"><Input id="cash-balance" type="number" min={0} step={100} inputMode="numeric" value={cash} onChange={(event) => setCash(event.target.value)} placeholder="0" /><span className="text-sm text-muted-foreground">so‘m</span></div></div>
        <div className="grid gap-2"><Label htmlFor="card-balance">Kartaga qo‘shiladi</Label><div className="flex items-center gap-2"><Input id="card-balance" type="number" min={0} step={100} inputMode="numeric" value={card} onChange={(event) => setCard(event.target.value)} placeholder="0" /><span className="text-sm text-muted-foreground">so‘m</span></div></div>
      </div>
      <div className="grid gap-2"><Label>Mablag‘ qo‘shilgan sana</Label><DatePickerField value={date} onChange={setDate} /></div>
      <div className="grid gap-2"><Label htmlFor="balance-note">Izoh (ixtiyoriy)</Label><Input id="balance-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={200} placeholder="Masalan: oylik maoshdan qoldiq" /></div>
      <Button type="submit" className="h-11" disabled={isPending}>{isPending ? <Loader2 className="size-4 animate-spin" /> : editingId ? <Pencil className="size-4" /> : <Plus className="size-4" />}{editingId ? "O‘zgarishni saqlash" : "Balansga qo‘shish"}</Button>
    </form>

    <section className="grid gap-2">
      <div><h2 className="font-semibold">Mablag‘lar tarixi</h2><p className="text-xs text-muted-foreground">Har bir qo‘shilgan mablag‘ sana bo‘yicha saqlanadi.</p></div>
      {entries.length === 0 ? <p className="rounded-2xl border border-dashed py-8 text-center text-sm text-muted-foreground">Hali mablag‘ qo‘shilmagan.</p> : entries.map((entry) => <div key={entry.id} className="flex items-center gap-3 rounded-2xl border p-3">
        <div className="min-w-0 flex-1"><p className="font-medium">{entry.entry_date}</p><p className="truncate text-xs text-muted-foreground">{entry.note || "Mablag‘ qo‘shildi"}</p></div>
        <div className="shrink-0 text-right text-xs"><p className="text-emerald-700">Naqd: {formatMoney(Number(entry.cash_amount))}</p><p className="text-blue-700">Karta: {formatMoney(Number(entry.card_amount))}</p></div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => edit(entry)} aria-label="Mablag‘ yozuvini tahrirlash"><Pencil className="size-4" /></Button>
      </div>)}
    </section>
  </div>;
}

function BalanceStat({ icon: Icon, label, value, tone }: { icon: typeof Banknote; label: string; value: number; tone: string }) {
  return <div className="rounded-2xl border bg-card p-3"><Icon className={`size-5 ${tone}`} /><p className="mt-2 text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold tabular-nums">{formatMoney(value)}</p></div>;
}
