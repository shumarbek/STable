"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithEmail, type ActionResult } from "@/features/auth/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    loginWithEmail,
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Parol</Label>
          <Link
            href="/reset-password"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Parolni unutdingizmi?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state && "error" in state && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} className="h-11 w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Kirish
      </Button>
    </form>
  );
}
