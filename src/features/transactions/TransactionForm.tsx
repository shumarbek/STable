"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  transactionFormSchema,
  type TransactionFormInput,
  type TransactionFormValues,
} from "@/lib/validators/transaction";
import { CategoryPicker } from "@/features/transactions/CategoryPicker";
import { DatePickerField } from "@/features/transactions/DatePickerField";
import { createTransaction, updateTransaction } from "@/features/transactions/actions";
import type { UserAccount } from "@/types/database";
import type { CategoryNode } from "@/features/categories/queries";
import { toIsoDate } from "@/lib/calculations/date";

const typeLabels: Record<TransactionFormValues["transactionType"], string> = {
  expense: "Xarajat",
  income: "Daromad",
  transfer: "O'tkazma",
  loan: "Qarz berish",
  debt_repayment: "Qarz qaytarish",
  refund: "Qaytarish",
};

export function TransactionForm({
  accounts,
  expenseCategories,
  incomeCategories,
  transferCategories,
  timezone,
  transactionId,
  defaultValues,
}: {
  accounts: UserAccount[];
  expenseCategories: CategoryNode[];
  incomeCategories: CategoryNode[];
  transferCategories: CategoryNode[];
  timezone: string;
  transactionId?: string;
  defaultValues?: Partial<TransactionFormInput>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [items, setItems] = useState<{ itemName: string; quantity: number }[]>([]);

  const form = useForm<TransactionFormInput>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      transactionType: "expense",
      accountId: accounts[0]?.id ?? "",
      amount: 0,
      transactionDate: toIsoDate(new Date()),
      isZeroConsumption: false,
      note: "",
      location: "",
      tagIds: [],
      items: [],
      idempotencyKey,
      ...defaultValues,
    },
  });

  const transactionType = form.watch("transactionType");
  const isZeroConsumption = form.watch("isZeroConsumption");
  const categoryId = form.watch("categoryId");

  const categories = useMemo(() => {
    if (transactionType === "income") return incomeCategories;
    if (
      transactionType === "transfer" ||
      transactionType === "loan" ||
      transactionType === "debt_repayment" ||
      transactionType === "refund"
    ) {
      return transferCategories;
    }
    return expenseCategories;
  }, [transactionType, expenseCategories, incomeCategories, transferCategories]);

  const [categoryLabel, setCategoryLabel] = useState<string | null>(null);

  function onSubmit(values: TransactionFormInput) {
    startTransition(async () => {
      const payload = {
        ...values,
        items: items
          .filter((i) => i.itemName.trim().length > 0)
          .map((i) => ({
            itemType: "misc",
            itemName: i.itemName,
            quantity: i.quantity,
            metadata: {},
          })),
      };
      const result = transactionId
        ? await updateTransaction(transactionId, payload)
        : await createTransaction(payload);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(transactionId ? "Tranzaksiya yangilandi" : "Tranzaksiya saqlandi");
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid gap-1.5">
        <Label>Turi</Label>
        <Tabs
          value={transactionType}
          onValueChange={(v) => {
            form.setValue("transactionType", v as TransactionFormInput["transactionType"]);
            form.setValue("categoryId", undefined);
            setCategoryLabel(null);
          }}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="expense">{typeLabels.expense}</TabsTrigger>
            <TabsTrigger value="income">{typeLabels.income}</TabsTrigger>
            <TabsTrigger value="transfer">{typeLabels.transfer}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="amount">Summa (so&apos;m)</Label>
        <Input
          id="amount"
          type="number"
          inputMode="numeric"
          min={0}
          step={100}
          disabled={isZeroConsumption}
          {...form.register("amount", { valueAsNumber: true })}
        />
        {form.formState.errors.amount && (
          <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
        )}
        {transactionType === "expense" && (
          <label className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={isZeroConsumption}
              onCheckedChange={(checked) => {
                form.setValue("isZeroConsumption", checked === true);
                if (checked) form.setValue("amount", 0);
              }}
            />
            Uyda tayyorlangan ovqat (0 so&apos;m)
          </label>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label>Sana</Label>
        <DatePickerField
          value={form.watch("transactionDate")}
          onChange={(iso) => form.setValue("transactionDate", iso)}
          timezone={timezone}
        />
      </div>

      <div className="grid gap-1.5">
        <Label>Hisob</Label>
        <Select
          value={form.watch("accountId")}
          onValueChange={(v) => form.setValue("accountId", v ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Hisobni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {transactionType === "transfer" && (
        <div className="grid gap-1.5">
          <Label>Qaysi hisobga</Label>
          <Select
            value={form.watch("transferAccountId") ?? undefined}
            onValueChange={(v) => form.setValue("transferAccountId", v ?? undefined)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Maqsad hisobni tanlang" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((a) => a.id !== form.watch("accountId"))
                .map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-1.5">
        <Label>Kategoriya</Label>
        <CategoryPicker
          categories={categories}
          value={categoryId ?? null}
          onChange={(id, label) => {
            form.setValue("categoryId", id);
            setCategoryLabel(label);
          }}
        />
        {categoryLabel && (
          <p className="text-xs text-muted-foreground">Tanlangan: {categoryLabel}</p>
        )}
      </div>

      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <Label>Qo&apos;shimcha itemlar (ixtiyoriy)</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setItems((prev) => [...prev, { itemName: "", quantity: 1 }])}
            className="gap-1"
          >
            <Plus className="size-3.5" /> Qo&apos;shish
          </Button>
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input
              value={item.itemName}
              placeholder="Nomi (masalan: Coca-Cola)"
              onChange={(e) => {
                const next = [...items];
                next[idx] = { ...next[idx], itemName: e.target.value };
                setItems(next);
              }}
            />
            <Input
              type="number"
              min={1}
              className="w-20"
              value={item.quantity}
              onChange={(e) => {
                const next = [...items];
                next[idx] = { ...next[idx], quantity: Number(e.target.value) || 1 };
                setItems(next);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setItems(items.filter((_, i) => i !== idx))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="note">Izoh (ixtiyoriy)</Label>
        <Textarea id="note" rows={2} {...form.register("note")} />
      </div>

      <Button type="submit" disabled={isPending} className="h-11 w-full">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Saqlash
      </Button>
    </form>
  );
}
