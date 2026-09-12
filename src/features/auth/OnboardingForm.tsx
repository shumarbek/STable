"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  completeOnboarding,
  type OnboardingResult,
} from "@/features/auth/actions";

export function OnboardingForm() {
  const [copied, setCopied] = useState(false);
  const [state, formAction, pending] = useActionState<
    OnboardingResult | null,
    FormData
  >(completeOnboarding, null);

  if (state && "success" in state) {
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(state.publicUserId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard API unavailable — user can still select and copy manually.
      }
    };

    return (
      <div className="flex flex-col items-center gap-5 py-2 text-center">
        <p className="text-sm text-muted-foreground">
          Sizning shaxsiy foydalanuvchi ID&apos;ingiz:
        </p>
        <div className="flex items-center gap-2 rounded-xl border bg-muted/50 px-5 py-3">
          <span className="font-mono text-2xl font-semibold tracking-widest">
            {state.publicUserId}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="ID nusxalash"
            onClick={handleCopy}
          >
            {copied ? <Check className="size-4 text-income" /> : <Copy className="size-4" />}
          </Button>
        </div>
        <p className="max-w-xs text-xs text-muted-foreground">
          Bu ID sizning profilingizda doim ko&apos;rinadi. Uni saqlab qo&apos;yishingiz
          shart emas.
        </p>
        <Button
          className="h-11 w-full"
          onClick={() => window.location.assign("/dashboard")}
        >
          Boshqaruv paneliga o&apos;tish
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="fullName">Ismingiz</Label>
        <Input id="fullName" name="fullName" required maxLength={120} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="universityName">Universitetingiz</Label>
        <Input id="universityName" name="universityName" required maxLength={200} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="faculty">Fakultet (ixtiyoriy)</Label>
        <Input id="faculty" name="faculty" maxLength={150} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="course">Kurs (ixtiyoriy)</Label>
        <Input id="course" name="course" maxLength={50} />
      </div>
      {state && "error" in state && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} className="h-11 w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Davom etish
      </Button>
    </form>
  );
}
