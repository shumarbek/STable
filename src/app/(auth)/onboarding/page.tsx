import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/features/auth/OnboardingForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
        <OnboardingForm />
      </CardContent>
    </Card>
  );
}
