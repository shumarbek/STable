"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
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
import { requestPasswordReset, type ActionResult } from "@/features/auth/actions";

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    requestPasswordReset,
    null
  );

  const succeeded = state && "success" in state;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Parolni tiklash</CardTitle>
        <CardDescription>
          Emailingizni kiriting, sizga parolni tiklash havolasini yuboramiz.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {succeeded ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <MailCheck className="size-8 text-info" />
            <p className="text-sm text-muted-foreground">
              Agar bu email ro&apos;yxatdan o&apos;tgan bo&apos;lsa, unga parolni
              tiklash havolasi yuborildi.
            </p>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            {state && "error" in state && (
              <p className="text-sm font-medium text-destructive">{state.error}</p>
            )}
            <Button type="submit" disabled={pending} className="h-11 w-full">
              {pending && <Loader2 className="size-4 animate-spin" />}
              Havola yuborish
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Kirishga qaytish
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
