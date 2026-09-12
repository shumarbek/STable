import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { Sidebar } from "@/features/dashboard/Sidebar";
import { MobileBottomNav } from "@/features/dashboard/MobileBottomNav";
import { TopBar } from "@/features/dashboard/TopBar";
import { InstallPrompt } from "@/features/pwa/InstallPrompt";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen flex-1 bg-muted/30">
      <Sidebar profile={profile} />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <TopBar profile={profile} />
        <main className="min-w-0 flex-1 px-3 pb-24 pt-3 sm:px-4 lg:px-8 lg:pb-8 lg:pt-4">{children}</main>
      </div>
      <MobileBottomNav />
      <InstallPrompt />
    </div>
  );
}
