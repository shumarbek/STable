"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, CalendarDays, Check, ChevronRight, CreditCard, Loader2, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getDailyExpenseReport, syncDailyExpenseReport } from "@/features/transactions/actions";
import { DatePickerField } from "@/features/transactions/DatePickerField";
import { CategoryIcon as Glyph } from "@/features/categories/CategoryIcon";
import type { CategoryNode } from "@/features/categories/queries";
import type { UserAccount } from "@/types/database";
import { formatMoney } from "@/lib/calculations/money";
import { toIsoDate } from "@/lib/calculations/date";

type Step = "date" | "category" | "type" | "details" | "success";
type PaymentMethod = "cash" | "card";
type DraftItem = {
  categoryId: string; name: string; icon: string | null; amount: string;
  paymentMethod: PaymentMethod; isZeroConsumption: boolean;
  rootName: string; typeName: string;
};

const accents = [
  "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300",
  "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300",
  "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300",
  "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300",
];

function description(category: CategoryNode) {
  const names = category.children.slice(0, 3).map((child) => child.name);
  return names.length ? names.join(", ") : "Chiqim tafsilotlarini kiriting";
}

function flattenCategories(categories: CategoryNode[]) {
  const map = new Map<string, { node: CategoryNode; root: CategoryNode; parent: CategoryNode | null }>();
  const visit = (node: CategoryNode, root: CategoryNode, parent: CategoryNode | null) => {
    map.set(node.id, { node, root, parent });
    node.children.forEach((child) => visit(child, root, node));
  };
  categories.forEach((root) => visit(root, root, null));
  return map;
}

export function ExpenseWizard({ accounts, categories }: { accounts: UserAccount[]; categories: CategoryNode[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("date");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryNode | null>(null);
  const [selectedType, setSelectedType] = useState<CategoryNode | null>(null);
  const [editingItems, setEditingItems] = useState<DraftItem[]>([]);
  const [reportItems, setReportItems] = useState<DraftItem[]>([]);
  const [transactionDate, setTransactionDate] = useState(toIsoDate(new Date()));
  const [savedItems, setSavedItems] = useState<DraftItem[]>([]);
  const [hadExistingReport, setHadExistingReport] = useState(false);
  const categoryMap = useMemo(() => flattenCategories(categories), [categories]);
  const cashAccount = accounts.find((account) => account.type === "cash");
  const cardAccount = accounts.find((account) => account.type === "card" || account.type === "bank");
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("uz");
    if (!query) return categories;
    return categories.filter((category) => [category.name, ...category.children.map((child) => child.name)].join(" ").toLocaleLowerCase("uz").includes(query));
  }, [categories, search]);
  const total = reportItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const editingIds = new Set(editingItems.map((item) => item.categoryId));
  const previewTotal = reportItems.filter((item) => !editingIds.has(item.categoryId)).reduce((sum, item) => sum + Number(item.amount || 0), 0)
    + editingItems.filter((item) => item.isZeroConsumption || Number(item.amount) > 0).reduce((sum, item) => sum + Number(item.amount || 0), 0);

  function loadDate() {
    startTransition(async () => {
      const result = await getDailyExpenseReport(transactionDate);
      if ("error" in result) { toast.error(result.error); return; }
      const restored = result.items.flatMap<DraftItem>((item) => {
        const category = categoryMap.get(item.categoryId);
        if (!category) return [];
        return [{ categoryId: item.categoryId, name: category.node.name || item.name, icon: category.node.icon ?? category.root.icon,
          amount: String(item.amount), paymentMethod: item.paymentMethod, isZeroConsumption: item.isZeroConsumption,
          rootName: category.root.name, typeName: category.parent?.name ?? category.node.name }];
      });
      setReportItems(restored);
      setHadExistingReport(restored.length > 0);
      setStep("category");
      if (restored.length) toast.info("Bu sanadagi oldingi chiqimlar yuklandi");
    });
  }

  function chooseCategory(category: CategoryNode) {
    setSelectedCategory(category); setSelectedType(null); setSearch(""); setStep("type");
  }

  function chooseType(type: CategoryNode) {
    const detailNodes = type.children.length ? type.children : [type];
    setSelectedType(type);
    setEditingItems(detailNodes.map((node) => {
      const existing = reportItems.find((item) => item.categoryId === node.id);
      const zero = node.slug === "food-home-cooked";
      return existing ?? { categoryId: node.id, name: node.name, icon: node.icon ?? type.icon ?? selectedCategory?.icon ?? null,
        amount: zero ? "0" : "", paymentMethod: "cash", isZeroConsumption: zero,
        rootName: selectedCategory?.name ?? type.name, typeName: type.name };
    }));
    setStep("details");
  }

  function addToReport() {
    const editableIds = new Set(editingItems.map((item) => item.categoryId));
    const active = editingItems.filter((item) => item.isZeroConsumption || Number(item.amount) > 0);
    setReportItems((current) => [...current.filter((item) => !editableIds.has(item.categoryId)), ...active]);
    setSelectedCategory(null); setSelectedType(null); setEditingItems([]); setStep("category");
    toast.success(active.length ? "Bandlar kunlik hisobotga qo‘shildi" : "Bo‘sh bandlar olib tashlandi");
  }

  function saveReport() {
    if (!reportItems.length && !hadExistingReport) { toast.error("Kamida bitta chiqim kiriting"); return; }
    if (reportItems.some((item) => item.paymentMethod === "cash" ? !cashAccount : !cardAccount)) {
      toast.error("Naqd yoki karta hisobi topilmadi. Balans bo‘limini tekshiring."); return;
    }
    const revision = crypto.randomUUID();
    startTransition(async () => {
      const result = await syncDailyExpenseReport({ transactionDate, items: reportItems.map((item, index) => ({
        categoryId: item.categoryId, accountId: (item.paymentMethod === "cash" ? cashAccount : cardAccount)!.id,
        itemType: item.categoryId, name: item.name, amount: Number(item.amount || 0), paymentMethod: item.paymentMethod,
        isZeroConsumption: item.isZeroConsumption, idempotencyKey: `daily-${transactionDate}-${revision}-${index}`,
      })) });
      if ("error" in result) { toast.error(result.error); return; }
      setSavedItems(reportItems); setStep("success"); router.refresh(); toast.success("Kunlik chiqim hisoboti saqlandi");
    });
  }

  function goBack() {
    if (step === "details") setStep("type");
    else if (step === "type") setStep("category");
    else if (step === "category") setStep("date");
    else router.back();
  }

  if (step === "success") {
    const savedTotal = savedItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return <section className="mx-auto flex min-h-[calc(100dvh-10rem)] w-full max-w-2xl items-center py-6"><div className="w-full rounded-3xl border bg-card p-5 shadow-sm sm:p-8">
      <div className="flex flex-col items-center text-center"><div className="mb-5 flex size-24 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"><Check className="size-12" strokeWidth={2.5} /></div><h1 className="font-heading text-2xl font-bold sm:text-3xl">Kunlik hisobot saqlandi!</h1><p className="mt-2 text-muted-foreground">{transactionDate} sanasidagi barcha chiqimlar yangilandi</p></div>
      <ReportSummary items={savedItems} total={savedTotal} onRemove={null} />
      <Button className="mt-6 h-12 w-full rounded-xl text-base" onClick={() => router.push("/dashboard")}>Bosh sahifaga qaytish</Button>
    </div></section>;
  }

  return <section className="mx-auto min-w-0 w-full max-w-2xl"><div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
    <header className="relative flex min-h-20 items-center border-b px-4 sm:px-6"><Button type="button" variant="ghost" size="icon-lg" onClick={goBack} aria-label="Orqaga"><ArrowLeft className="size-5" /></Button><div className="pointer-events-none absolute inset-x-12 text-center sm:inset-x-16"><p className="truncate font-heading text-lg font-bold sm:text-2xl">{step === "date" ? "Chiqim sanasi" : step === "category" ? "Chiqim qo‘shish" : selectedType?.name ?? selectedCategory?.name}</p>{step !== "date" && <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">{transactionDate} · {step === "category" ? "Kategoriyani tanlang" : step === "type" ? "Chiqim turini tanlang" : "Summa va to‘lov usulini kiriting"}</p>}</div></header>
    <div className="p-4 sm:p-6">
      {step === "date" && <div className="grid gap-5 py-4 sm:py-8"><div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CalendarDays className="size-8" /></div><div className="text-center"><h2 className="font-heading text-xl font-bold">Avval sanani tanlang</h2><p className="mt-1 text-sm text-muted-foreground">Shu sanadagi barcha chiqimlarni bitta hisobotda saqlaysiz.</p></div><DatePickerField value={transactionDate} onChange={setTransactionDate} /><Button className="h-12 rounded-xl" onClick={loadDate} disabled={isPending}>{isPending && <Loader2 className="size-4 animate-spin" />}Davom etish</Button></div>}
      {step === "category" && <>{reportItems.length > 0 && <ReportSummary items={reportItems} total={total} onRemove={(id) => setReportItems((current) => current.filter((item) => item.categoryId !== id))} compact />}<div className="relative mb-4 mt-4"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kategoriya qidirish..." className="h-11 rounded-xl bg-muted/40 pl-10" /></div><div className="grid gap-2.5">{filtered.map((category, index) => <CategoryRow key={category.id} category={category} index={index} onClick={() => chooseCategory(category)} />)}{filtered.length === 0 && <div className="py-16 text-center text-muted-foreground">Kategoriya topilmadi</div>}</div><div className="mt-5 rounded-2xl border bg-card p-3 shadow-sm"><div className="mb-3 flex items-center justify-between px-1"><span className="text-sm text-muted-foreground">{reportItems.length} ta band</span><span className="font-heading text-lg font-bold tabular-nums">{formatMoney(total)}</span></div><Button className="h-12 w-full rounded-xl text-base" disabled={isPending || (reportItems.length === 0 && !hadExistingReport)} onClick={saveReport}>{isPending && <Loader2 className="size-4 animate-spin" />}{reportItems.length ? "Barchasini saqlash" : "Hisobotni tozalash"}</Button></div></>}
      {step === "type" && selectedCategory && <div className="grid gap-3"><div className="mb-2 flex flex-col items-center py-2 text-center"><IconBubble icon={selectedCategory.icon} index={0} large /><h2 className="mt-3 font-heading text-xl font-bold sm:text-2xl">{selectedCategory.name}</h2><p className="text-sm text-muted-foreground sm:text-base">Chiqim turini tanlang</p></div>{(selectedCategory.children.length ? selectedCategory.children : [selectedCategory]).map((type, index) => <CategoryRow key={type.id} category={type} index={index + 1} onClick={() => chooseType(type)} />)}</div>}
      {step === "details" && selectedType && <div><div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 text-xs font-medium text-muted-foreground"><span className="text-right">Naqd</span><span>To‘lov usuli</span><span>Karta</span></div><div className="grid gap-2.5">{editingItems.map((item, index) => <ExpenseItemRow key={item.categoryId} item={item} index={index} onChange={(next) => setEditingItems((current) => current.map((entry) => entry.categoryId === next.categoryId ? next : entry))} />)}</div><div className="mt-5 rounded-2xl border bg-card p-3 shadow-sm"><div className="mb-3 flex items-center justify-between px-1"><span className="text-sm text-muted-foreground">Kunlik hisobot</span><span className="font-heading text-lg font-bold tabular-nums">{formatMoney(previewTotal)}</span></div><Button className="h-12 w-full rounded-xl text-base" onClick={addToReport}><Pencil className="size-4" />Hisobotga qo‘shish</Button></div></div>}
    </div>
  </div></section>;
}

function ExpenseItemRow({ item, index, onChange }: { item: DraftItem; index: number; onChange: (item: DraftItem) => void }) {
  return <div className={cn("grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_6.75rem] items-center gap-2 rounded-2xl border p-2.5 transition-colors sm:grid-cols-[auto_1fr_11rem] sm:gap-3 sm:p-3", (item.isZeroConsumption || Number(item.amount) > 0) && "border-primary/40 bg-primary/[0.025]")}><IconBubble icon={item.icon} index={index} /><div className="min-w-0"><p className="truncate text-sm font-semibold sm:text-base">{item.name}</p><div className="mt-1.5 flex items-center gap-1 sm:mt-2 sm:gap-2"><Banknote className={cn("size-3.5 shrink-0 sm:size-4", item.paymentMethod === "cash" ? "text-primary" : "text-muted-foreground")} /><Switch checked={item.paymentMethod === "card"} onCheckedChange={(checked) => onChange({ ...item, paymentMethod: checked ? "card" : "cash" })} aria-label={`${item.name}: chapda naqd, o‘ngda karta`} /><CreditCard className={cn("size-3.5 shrink-0 sm:size-4", item.paymentMethod === "card" ? "text-primary" : "text-muted-foreground")} /></div></div><div className="flex min-w-0 items-center gap-1 sm:gap-2"><Input value={item.amount} type="number" min={0} step={100} inputMode="numeric" placeholder="0" disabled={item.isZeroConsumption} onChange={(event) => onChange({ ...item, amount: event.target.value })} className="h-10 min-w-0 px-2 text-right text-sm font-semibold tabular-nums sm:h-11 sm:text-base" aria-label={`${item.name} summasi`} /><span className="shrink-0 text-[11px] text-muted-foreground sm:text-sm">so‘m</span></div></div>;
}

function ReportSummary({ items, total, onRemove, compact = false }: { items: DraftItem[]; total: number; onRemove: ((id: string) => void) | null; compact?: boolean }) {
  return <div className={cn("rounded-2xl border bg-background p-3 sm:p-4", !compact && "mt-8")}><div className="mb-2 flex items-center justify-between"><p className="font-semibold">Kunlik chiqimlar</p><p className="font-bold tabular-nums">{formatMoney(total)}</p></div><div className={cn("divide-y", compact && items.length > 4 && "max-h-56 overflow-y-auto pr-1")}>{items.map((item, index) => <div key={item.categoryId} className="flex items-center gap-2 py-2"><IconBubble icon={item.icon} index={index} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.rootName} · {item.name}</p><p className="text-xs text-muted-foreground">{item.paymentMethod === "cash" ? "Naqd" : "Karta"}</p></div><p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(Number(item.amount || 0))}</p>{onRemove && <Button type="button" variant="ghost" size="icon-sm" aria-label={`${item.name}ni olib tashlash`} onClick={() => onRemove(item.categoryId)}><Trash2 className="size-4 text-destructive" /></Button>}</div>)}</div></div>;
}

function CategoryRow({ category, index, onClick }: { category: CategoryNode; index: number; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="group flex min-h-16 min-w-0 w-full items-center gap-2 rounded-2xl border bg-background p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-20 sm:gap-3 sm:p-3"><IconBubble icon={category.icon} index={index} /><span className="min-w-0 flex-1 overflow-hidden"><span className="block truncate font-heading text-sm font-semibold sm:text-base">{category.name}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground sm:text-sm">{description(category)}</span></span><ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:size-5" /></button>;
}

function IconBubble({ icon, index, large = false }: { icon?: string | null; index: number; large?: boolean }) {
  return <span className={cn("flex shrink-0 items-center justify-center rounded-full", large ? "size-14 sm:size-16" : "size-10 sm:size-12", accents[index % accents.length])}><Glyph icon={icon} className={large ? "size-7 sm:size-8" : "size-4 sm:size-5"} /></span>;
}
