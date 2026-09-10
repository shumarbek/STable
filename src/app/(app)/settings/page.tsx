import Link from "next/link";
import { ChevronRight, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/features/settings/ThemeToggle";
import { LogoutButton } from "@/features/dashboard/LogoutButton";
import { DeleteAccountDialog } from "@/features/settings/DeleteAccountDialog";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Sozlamalar</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ko&apos;rinish</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm">Tungi rejim</span>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Boshqarish</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          <Link
            href="/settings/accounts"
            className="flex items-center justify-between py-3 text-sm"
          >
            <span className="flex items-center gap-2">
              <Wallet className="size-4 text-muted-foreground" />
              Hisoblarim
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hisob</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <LogoutButton />
          <DeleteAccountDialog />
        </CardContent>
      </Card>
    </div>
  );
}
