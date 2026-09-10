"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { confirmPasswordReset, type ActionResult } from "@/features/auth/actions";

export default function ConfirmResetPasswordPage() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    confirmPasswordReset,
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Yangi parol</CardTitle>
        <CardDescription>Hisobingiz uchun yangi parol o&apos;rnating.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="password">Yangi parol</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirmPassword">Parolni tasdiqlang</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required />
          </div>
          {state && "error" in state && (
            <p className="text-sm font-medium text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={pending} className="h-11 w-full">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Parolni saqlash
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
