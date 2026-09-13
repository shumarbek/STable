"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  budgetFormSchema,
  periodLabels,
  type BudgetFormInput,
} from "@/lib/validators/budget";
import { createBudget } from "@/features/budgets/actions";
import type { Category } from "@/types/database";

export function CreateBudgetDialog({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<BudgetFormInput>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      name: "",
      period: "monthly",
      warningThresholdPercent: 70,
    },
  });

  function onSubmit(values: BudgetFormInput) {
    startTransition(async () => {
      const result = await createBudget(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Budjet yaratildi");
      form.reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="size-4" />
            Yangi budjet
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yangi budjet yaratish</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Nomi</Label>
            <Input id="name" {...form.register("name")} placeholder="Masalan: Oziq-ovqat" />
          </div>
          <div className="grid gap-1.5">
            <Label>Kategoriya (ixtiyoriy)</Label>
            <Select
              value={form.watch("categoryId") ?? "none"}
              onValueChange={(v) =>
                form.setValue("categoryId", v && v !== "none" ? v : null)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value) => value === "none"
                    ? "Barcha kategoriyalar"
                    : categories.find((category) => category.id === value)?.name ?? "Barcha kategoriyalar"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Barcha kategoriyalar</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="amountLimit">Limit (so&apos;m)</Label>
            <Input
              id="amountLimit"
              type="number"
              {...form.register("amountLimit", { valueAsNumber: true })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Davr</Label>
            <Select
              value={form.watch("period")}
              onValueChange={(v) => {
                if (v) form.setValue("period", v as BudgetFormInput["period"]);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value) => periodLabels[value as keyof typeof periodLabels] ?? "Oylik"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(periodLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isPending} className="h-11 w-full">
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Yaratish
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
