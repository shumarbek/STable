import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/features/auth/OnboardingForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfileAvatars } from "@/lib/profile/avatars";
import { DeleteAccountDialog } from "@/features/settings/DeleteAccountDialog";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    redirect("/login");
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (existingProfile) {
    redirect("/dashboard");
  }

  const avatars = await getProfileAvatars();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Xush kelibsiz! 👋</CardTitle>
        <CardDescription>
          Boshlashdan oldin, sizni yaxshiroq bilishimiz uchun bir necha ma&apos;lumot
          kiriting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OnboardingForm avatars={avatars} />
        <div className="mt-6 border-t pt-4">
          <p className="mb-2 text-xs text-muted-foreground">
            Agar avval hisobni o‘chirishda xatolik yuz bergan bo‘lsa, uni shu yerdan butunlay o‘chirishingiz mumkin.
          </p>
          <DeleteAccountDialog />
        </div>
      </CardContent>
    </Card>
  );
}
