"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Loader2,
  Search,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createTransaction } from "@/features/transactions/actions";
import type { CategoryNode } from "@/features/categories/queries";
import type { UserAccount } from "@/types/database";
import { formatMoney } from "@/lib/calculations/money";
import { toIsoDate } from "@/lib/calculations/date";
import { cn } from "cn";

type Step = "category" | "type" | "details" | "success";
type DraftItem = { id: string; name: string; icon: string; enabled: boolean; amount: string };

const accentStyles = [
  "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300",
  "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300",
  "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300",
  "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300",
];

function categoryDescription(category: CategoryNode) {
  const names = category.children.slice(0, 3).map((child) => child.name);
  return names.length ? names.join(", ") : "Xarajat tafsilotlarini kiriting";
}

function accountIcon(type: UserAccount["type"]) {
  if (type === "cash") return Banknote;
  if (type === "card" || type === "bank") return CreditCard;
  return WalletCards;
}

export function ExpenseWizard({
  accounts,
  categories,
}: {
  accounts: UserAccount[];
  categories: CategoryNode[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("category");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryNode | null>(null);
  const [selectedType, setSelectedType] = useState<CategoryNode | null>(null);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [transactionDate, setTransactionDate] = useState(toIsoDate(new Date()));
  const [savedItems, setSavedItems] = useState<DraftItem[]>([]);
  const [savedTotal, setSavedTotal] = useState(0);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("uz");
    if (!query) return categories;
    return categories.filter((category) =>
      [category.name, ...category.children.map((child) => child.name)]
        .join(" ")
        .toLocaleLowerCase("uz")
        .includes(query)
    );
  }, [categories, search]);

  const selectedAccount = accounts.find((account) => account.id === accountId) ?? accounts[0];
  const activeItems = items.filter((item) => item.enabled && Number(item.amount) > 0);
  const total = activeItems.reduce((sum, item) => sum + Number(item.amount), 0);

  function chooseCategory(category: CategoryNode) {
    setSelectedCategory(category);
    setSelectedType(null);
    setSearch("");
    setStep("type");
  }

  function chooseType(type: CategoryNode) {
    const detailNodes = type.children.length ? type.children : [type];
    setSelectedType(type);
    setItems(
      detailNodes.map((node) => ({
        id: node.id,
        name: node.name,
        icon: node.icon ?? type.icon ?? selectedCategory?.icon ?? "•",
        enabled: false,
        amount: "",
      }))
    );
    setStep("details");
  }

  function goBack() {
    if (step === "details") setStep("type");
    else if (step === "type") setStep("category");
    else router.back();
  }

  function saveExpense() {
    if (!selectedType || !selectedAccount || activeItems.length === 0 || total <= 0) {
      toast.error("Kamida bitta xarajat summasini kiriting");
      return;
    }

    startTransition(async () => {
      const result = await createTransaction({
        transactionType: "expense",
        accountId: selectedAccount.id,
        categoryId: selectedType.id,
        amount: total,
        transactionDate,
        isZeroConsumption: false,
        note: selectedType.name,
        location: "",
        tagIds: [],
        idempotencyKey,
        items: activeItems.map((item) => ({
          itemType: item.id,
          itemName: item.name,
          quantity: 1,
          metadata: { amount: Number(item.amount), accountId: selectedAccount.id },
        })),
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      setSavedItems(activeItems);
      setSavedTotal(total);
      setStep("success");
      toast.success("Xarajatlar saqlandi");
    });
  }

  if (step === "success") {
    return (
      <section className="mx-auto flex min-h-[calc(100dvh-10rem)] w-full max-w-2xl flex-col items-center justify-center py-6">
        <div className="w-full rounded-3xl border bg-card p-5 shadow-sm sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5 flex size-24 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              <Check className="size-12" strokeWidth={2.5} />
            </div>
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">Xarajatlar qo&apos;shildi!</h1>
            <p className="mt-2 text-muted-foreground">Ma&apos;lumotlar hisobingizga muvaffaqiyatli saqlandi</p>
          </div>

          <div className="mt-8 rounded-2xl border bg-background p-4 sm:p-5">
            <div className="flex items-center gap-3 border-b pb-4">
              <CategoryIcon icon={selectedType?.icon ?? selectedCategory?.icon ?? "✓"} index={0} large />
              <div>
                <p className="font-heading text-lg font-semibold">{selectedType?.name}</p>
                <p className="text-sm text-muted-foreground">{transactionDate}</p>
              </div>
            </div>
            <div className="divide-y">
              {savedItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  <CategoryIcon icon={item.icon} index={1} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CreditCard className="size-3.5" /> {selectedAccount?.name}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">{formatMoney(Number(item.amount))}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t pt-4 text-lg font-bold">
              <span>Jami</span>
              <span className="tabular-nums">{formatMoney(savedTotal)}</span>
            </div>
          </div>

          <Button className="mt-6 h-12 w-full rounded-xl text-base" onClick={() => router.push("/dashboard")}>
            Bosh sahifaga qaytish
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl">
      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <header className="relative flex min-h-20 items-center border-b px-4 sm:px-6">
          <Button type="button" variant="ghost" size="icon-lg" onClick={goBack} aria-label="Orqaga">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="pointer-events-none absolute inset-x-16 text-center">
            <p className="font-heading text-xl font-bold sm:text-2xl">
              {step === "category" ? "Xarajat qo‘shish" : selectedType?.name ?? selectedCategory?.name}
            </p>
            {step !== "category" && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {step === "type" ? "Xarajat turini tanlang" : "Kerakli itemlarni tanlang va summani kiriting"}
              </p>
            )}
          </div>
        </header>

        <div className="p-4 sm:p-6">
          {step === "category" && (
            <>
              <div className="relative mb-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Kategoriya qidirish..."
                  className="h-11 rounded-xl bg-muted/40 pl-10"
                  autoFocus
                />
              </div>
              <div className="grid gap-2.5">
                {filteredCategories.map((category, index) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    index={index}
                    onClick={() => chooseCategory(category)}
                  />
                ))}
                {filteredCategories.length === 0 && (
                  <div className="py-16 text-center text-muted-foreground">Kategoriya topilmadi</div>
                )}
              </div>
            </>
          )}

          {step === "type" && selectedCategory && (
            <div className="grid gap-3">
              <div className="mb-2 flex flex-col items-center py-2 text-center">
                <CategoryIcon icon={selectedCategory.icon ?? "•"} index={0} large />
                <h2 className="mt-3 font-heading text-2xl font-bold">{selectedCategory.name}</h2>
                <p className="text-muted-foreground">Xarajat turini tanlang</p>
              </div>
              {(selectedCategory.children.length ? selectedCategory.children : [selectedCategory]).map((type, index) => (
                <CategoryRow key={type.id} category={type} index={index + 1} onClick={() => chooseType(type)} />
              ))}
            </div>
          )}

          {step === "details" && selectedType && (
            <div>
              <div className="mb-4 grid gap-3 rounded-2xl bg-muted/40 p-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="expense-account">Hisob</Label>
                  <Select value={accountId} onValueChange={(value) => setAccountId(value ?? "")}>
                    <SelectTrigger id="expense-account" className="h-10 w-full bg-background">
                      <SelectValue placeholder="Hisobni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="expense-date">Sana</Label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="expense-date"
                      type="date"
                      value={transactionDate}
                      max={toIsoDate(new Date())}
                      onChange={(event) => setTransactionDate(event.target.value)}
                      className="h-10 bg-background pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2.5">
                {items.map((item, index) => {
                  const AccountIcon = accountIcon(selectedAccount?.type ?? "card");
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "grid grid-cols-[auto_1fr] gap-3 rounded-2xl border p-3 transition-colors sm:grid-cols-[auto_1fr_auto] sm:items-center",
                        item.enabled && "border-primary/40 bg-primary/[0.025]"
                      )}
                    >
                      <CategoryIcon icon={item.icon} index={index} />
                      <div className="min-w-0">
                        <p className="font-semibold">{item.name}</p>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <AccountIcon className="size-3.5" />
                          <span className="truncate">{selectedAccount?.name}</span>
                          <Switch
                            checked={item.enabled}
                            onCheckedChange={(checked) =>
                              setItems((current) => current.map((entry) =>
                                entry.id === item.id ? { ...entry, enabled: checked } : entry
                              ))
                            }
                            aria-label={`${item.name} xarajatini tanlash`}
                          />
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 sm:col-span-1 sm:w-44">
                        <Input
                          value={item.amount}
                          type="number"
                          min={0}
                          step={100}
                          inputMode="numeric"
                          placeholder="0"
                          disabled={!item.enabled}
                          onChange={(event) =>
                            setItems((current) => current.map((entry) =>
                              entry.id === item.id ? { ...entry, amount: event.target.value } : entry
                            ))
                          }
                          className="h-11 text-right text-base font-semibold tabular-nums"
                          aria-label={`${item.name} summasi`}
                        />
                        <span className="text-sm text-muted-foreground">so‘m</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="sticky bottom-16 mt-5 rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur md:bottom-4">
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="text-sm text-muted-foreground">{activeItems.length} ta item</span>
                  <span className="font-heading text-lg font-bold tabular-nums">{formatMoney(total)}</span>
                </div>
                <Button
                  className="h-12 w-full rounded-xl text-base"
                  disabled={isPending || activeItems.length === 0}
                  onClick={saveExpense}
                >
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  Saqlash
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CategoryRow({
  category,
  index,
  onClick,
}: {
  category: CategoryNode;
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-20 w-full items-center gap-3 rounded-2xl border bg-background p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <CategoryIcon icon={category.icon ?? "•"} index={index} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-heading text-base font-semibold">{category.name}</span>
        <span className="mt-0.5 block truncate text-sm text-muted-foreground">{categoryDescription(category)}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function CategoryIcon({ icon, index, large = false }: { icon: string; index: number; large?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        large ? "size-16 text-3xl" : "size-12 text-2xl",
        accentStyles[index % accentStyles.length]
      )}
    >
      {icon}
    </span>
  );
}
