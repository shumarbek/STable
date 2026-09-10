"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { onboardingSchema, type OnboardingValues } from "@/lib/validators/auth";
import { updateProfile } from "@/features/profile/actions";
import type { Profile } from "@/types/database";

export function EditProfileForm({ profile }: { profile: Profile }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: profile.full_name,
      universityName: profile.university_name,
      faculty: profile.faculty ?? "",
      course: profile.course ?? "",
    },
  });

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
