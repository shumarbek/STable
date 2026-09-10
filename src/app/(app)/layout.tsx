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
      <div className="flex flex-1 flex-col md:pl-64">
        <TopBar profile={profile} />
        <main className="flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-8">{children}</main>
      </div>
      <MobileBottomNav />
      <InstallPrompt />
    </div>
  );
}
