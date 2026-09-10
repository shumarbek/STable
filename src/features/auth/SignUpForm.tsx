"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpWithEmail, type ActionResult } from "@/features/auth/actions";

export function SignUpForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    signUpWithEmail,
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Parol</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <p className="text-xs text-muted-foreground">
          Kamida 8 belgi, harf va raqamdan iborat bo&apos;lsin.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="confirmPassword">Parolni tasdiqlang</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      {state && "error" in state && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} className="h-11 w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Hisob yaratish
      </Button>
    </form>
  );
}
