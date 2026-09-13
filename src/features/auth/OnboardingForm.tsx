"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Mars, Venus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  completeOnboarding,
  type OnboardingResult,
} from "@/features/auth/actions";
import { AvatarPicker } from "@/features/profile/AvatarPicker";
import { UZBEKISTAN_REGIONS } from "@/lib/profile/regions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "cn";

export function OnboardingForm({
  avatars,
}: {
  avatars: { male: string[]; female: string[] };
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [region, setRegion] = useState("");
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
          onClick={() => router.push("/dashboard")}
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
      <div className="grid gap-2">
        <Label>Jinsingiz</Label>
        <input type="hidden" name="gender" value={gender} />
        <input type="hidden" name="avatarUrl" value={avatarUrl} />
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: "male" as const, label: "Erkak", icon: Mars },
            { value: "female" as const, label: "Ayol", icon: Venus },
          ]).map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setGender(option.value);
                  setAvatarUrl("");
                }}
                className={cn(
                  "flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition",
                  gender === option.value && "border-primary bg-primary/5 text-primary"
                )}
              >
                <Icon className="size-4" /> {option.label}
              </button>
            );
          })}
        </div>
      </div>
      <AvatarPicker
        gender={gender}
        value={avatarUrl}
        onChange={setAvatarUrl}
        avatars={avatars}
      />
      <div className="grid gap-1.5">
        <Label>Viloyat yoki hudud</Label>
        <input type="hidden" name="region" value={region} />
        <Select value={region || undefined} onValueChange={(value) => setRegion(value ?? "")}>
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder="Hududingizni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {UZBEKISTAN_REGIONS.map((item) => (
              <SelectItem key={item} value={item}>{item}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
