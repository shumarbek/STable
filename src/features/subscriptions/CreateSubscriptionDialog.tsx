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
  subscriptionFormSchema,
  billingCycleLabels,
  type SubscriptionFormInput,
} from "@/lib/validators/subscription";
import { createSubscription } from "@/features/subscriptions/actions";
import type { UserAccount, Category } from "@/types/database";

export function CreateSubscriptionDialog({
  accounts,
  categories,
}: {
  accounts: UserAccount[];
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<SubscriptionFormInput>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: { providerName: "", billingCycle: "monthly", nextBillingDate: "" },
  });

  function onSubmit(values: SubscriptionFormInput) {
    startTransition(async () => {
      const result = await createSubscription(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Obuna qo'shildi");
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
            Yangi obuna
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yangi obuna qo&apos;shish</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="providerName">Xizmat nomi</Label>
            <Input
              id="providerName"
              {...form.register("providerName")}
              placeholder="Masalan: Netflix"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="amount">Summa</Label>
            <Input id="amount" type="number" {...form.register("amount", { valueAsNumber: true })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Davriylik</Label>
            <Select
              value={form.watch("billingCycle")}
              onValueChange={(v) => {
                if (v) form.setValue("billingCycle", v as SubscriptionFormInput["billingCycle"]);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value) => billingCycleLabels[value as keyof typeof billingCycleLabels] ?? "Oylik"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(billingCycleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="nextBillingDate">Keyingi to&apos;lov sanasi</Label>
            <Input
              id="nextBillingDate"
              type="date"
              {...form.register("nextBillingDate")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Hisob (ixtiyoriy)</Label>
            <Select
              value={form.watch("accountId") ?? "none"}
              onValueChange={(v) => form.setValue("accountId", v && v !== "none" ? v : null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value) => value === "none"
                    ? "Tanlanmagan"
                    : accounts.find((account) => account.id === value)?.name ?? "Tanlanmagan"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanlanmagan</SelectItem>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Kategoriya (ixtiyoriy)</Label>
            <Select
              value={form.watch("categoryId") ?? "none"}
              onValueChange={(v) => form.setValue("categoryId", v && v !== "none" ? v : null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value) => value === "none"
                    ? "Tanlanmagan"
                    : categories.find((category) => category.id === value)?.name ?? "Tanlanmagan"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanlanmagan</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isPending} className="h-11 w-full">
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Qo&apos;shish
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
