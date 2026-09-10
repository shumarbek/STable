"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteAccount } from "@/features/profile/actions";

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAccount();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Hisobingiz o'chirildi");
      router.push("/login");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" className="justify-start gap-3 text-destructive">
            <Trash2 className="size-4" />
            Hisobni o&apos;chirish
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hisobni o&apos;chirishni tasdiqlaysizmi?</DialogTitle>
          <DialogDescription>
            Bu amalni orqaga qaytarib bo&apos;lmaydi. Barcha tranzaksiyalar,
            budjetlar, maqsadlar va hisobotlaringiz butunlay o&apos;chib
            ketadi.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Bekor qilish
          </Button>
          <Button variant="destructive" disabled={isPending} onClick={handleDelete}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Ha, o&apos;chirish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
