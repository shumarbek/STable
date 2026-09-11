"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resendConfirmationEmail,
  type ActionResult,
} from "@/features/auth/actions";

export function ResendConfirmationForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    resendConfirmationEmail,
    null
  );

  return (
    <form action={formAction} className="mt-5 grid gap-3 border-t pt-5 text-left">
      <div className="grid gap-1.5">
        <Label htmlFor="confirmation-email">Email</Label>
        <Input
          id="confirmation-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="siz@example.com"
          required
        />
      </div>
      {state && "error" in state && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state && "success" in state && (
        <p className="text-sm font-medium text-emerald-600" role="status">
          Agar email tasdiqlanmagan bo&apos;lsa, yangi havola yuborildi. Spam papkasini ham tekshiring.
        </p>
      )}
      <Button type="submit" variant="outline" disabled={pending} className="h-10 w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Tasdiqlash xatini qayta yuborish
      </Button>
    </form>
  );
}
