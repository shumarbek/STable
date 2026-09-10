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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { goalFormSchema, type GoalFormInput } from "@/lib/validators/goal";
import { createGoal } from "@/features/goals/actions";

export function CreateGoalDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<GoalFormInput>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: { name: "", currentAmount: 0 },
  });

  function onSubmit(values: GoalFormInput) {
    startTransition(async () => {
      const result = await createGoal(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Maqsad yaratildi");
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
            Yangi maqsad
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yangi maqsad yaratish</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Nomi</Label>
            <Input id="name" {...form.register("name")} placeholder="Masalan: MacBook" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="targetAmount">Maqsad summasi</Label>
            <Input
              id="targetAmount"
              type="number"
              {...form.register("targetAmount", { valueAsNumber: true })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="currentAmount">Hozirgi yig&apos;ilgan summa</Label>
            <Input
              id="currentAmount"
              type="number"
              {...form.register("currentAmount", { valueAsNumber: true })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="deadline">Muddat (ixtiyoriy)</Label>
            <Input id="deadline" type="date" {...form.register("deadline")} />
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
