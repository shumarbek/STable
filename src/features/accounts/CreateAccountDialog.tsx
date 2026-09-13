"use client";

import { useState, useTransition } from "react";
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
  accountFormSchema,
  accountTypeLabels,
  type AccountFormInput,
} from "@/lib/validators/account";
import { createAccount } from "@/features/accounts/actions";
import { useRouter } from "next/navigation";

export function CreateAccountDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<AccountFormInput>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: { name: "", type: "cash", currency: "UZS", initialBalance: 0 },
  });

  function onSubmit(values: AccountFormInput) {
    startTransition(async () => {
      const result = await createAccount(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Hisob yaratildi");
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
            Yangi hisob
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yangi hisob qo&apos;shish</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Nomi</Label>
            <Input id="name" {...form.register("name")} placeholder="Masalan: Uzcard" />
          </div>
          <div className="grid gap-1.5">
            <Label>Turi</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(v) => {
                if (v) form.setValue("type", v as AccountFormInput["type"]);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value) => accountTypeLabels[value as keyof typeof accountTypeLabels] ?? "Naqd"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(accountTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="initialBalance">Boshlang&apos;ich balans</Label>
            <Input
              id="initialBalance"
              type="number"
              {...form.register("initialBalance", { valueAsNumber: true })}
            />
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
