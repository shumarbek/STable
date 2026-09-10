import { getCurrentProfile } from "@/lib/supabase/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyableId } from "@/features/profile/CopyableId";
import { EditProfileForm } from "@/features/profile/EditProfileForm";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  if (!profile) return null;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shaxsiy ma&apos;lumotlar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Foydalanuvchi ID</span>
            <CopyableId id={profile.public_user_id} />
          </div>
          <EditProfileForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hisob ma&apos;lumotlari</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ro&apos;yxatdan o&apos;tgan sana</span>
            <span>{new Date(profile.created_at).toLocaleDateString("uz-UZ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vaqt zonasi</span>
            <span>{profile.timezone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valyuta</span>
            <span>{profile.currency}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
