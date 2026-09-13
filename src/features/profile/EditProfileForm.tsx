"use client";

import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Mars, Venus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { onboardingSchema, type OnboardingValues } from "@/lib/validators/auth";
import { updateProfile } from "@/features/profile/actions";
import type { Profile } from "@/types/database";
import { AvatarPicker } from "@/features/profile/AvatarPicker";
import { cn } from "cn";
import { UZBEKISTAN_REGIONS } from "@/lib/profile/regions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function EditProfileForm({
  profile,
  avatars,
}: {
  profile: Profile;
  avatars: { male: string[]; female: string[] };
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: profile.full_name,
      universityName: profile.university_name,
      faculty: profile.faculty ?? "",
      course: profile.course ?? "",
      gender: profile.gender ?? "male",
      avatarUrl: profile.avatar_url ?? "",
      region: profile.region ?? undefined,
    },
  });
  const gender = useWatch({ control: form.control, name: "gender" }) ?? "male";
  const avatarUrl = useWatch({ control: form.control, name: "avatarUrl" }) ?? "";
  const region = useWatch({ control: form.control, name: "region" });

  function onSubmit(values: OnboardingValues) {
    startTransition(async () => {
      const result = await updateProfile(values);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Profil yangilandi");
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="fullName">Ism</Label>
        <Input id="fullName" {...form.register("fullName")} />
      </div>
      <div className="grid gap-2">
        <Label>Jinsingiz</Label>
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
                  form.setValue("gender", option.value, { shouldDirty: true });
                  form.setValue("avatarUrl", "", { shouldDirty: true });
                }}
                className={cn(
                  "flex h-10 items-center justify-center gap-2 rounded-xl border text-sm font-medium",
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
        onChange={(value) => form.setValue("avatarUrl", value, { shouldDirty: true })}
        avatars={avatars}
      />
      <div className="grid gap-1.5">
        <Label>Viloyat yoki hudud</Label>
        <Select
          value={region}
          onValueChange={(value) => value && form.setValue("region", value, { shouldDirty: true })}
        >
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Hududingizni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {UZBEKISTAN_REGIONS.map((item) => (
              <SelectItem key={item} value={item}>{item}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.region && (
          <p className="text-sm text-destructive">{form.formState.errors.region.message}</p>
        )}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="universityName">Universitet</Label>
        <Input id="universityName" {...form.register("universityName")} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="faculty">Fakultet</Label>
        <Input id="faculty" {...form.register("faculty")} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="course">Kurs</Label>
        <Input id="course" {...form.register("course")} />
      </div>
      <Button type="submit" disabled={isPending} className="h-10">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Saqlash
      </Button>
    </form>
  );
}
