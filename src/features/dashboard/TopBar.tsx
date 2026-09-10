import Link from "next/link";
import { Plus, Wallet } from "lucide-react";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/features/notifications/NotificationsBell";

export function TopBar({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-card/80 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex items-center gap-2 md:hidden">
        <Wallet className="size-5 text-primary" />
        <span className="font-heading font-semibold">STable</span>
      </div>

      <div className="hidden md:block">
        <p className="text-sm text-muted-foreground">
          Salom, <span className="font-medium text-foreground">{profile.full_name}</span> 👋
        </p>
      </div>

      <div className="flex items-center gap-2">
        <NotificationsBell />
        <Button
          className="hidden gap-2 md:inline-flex"
          render={
            <Link href="/transactions/new">
              <Plus className="size-4" />
              Xarajat qo&apos;shish
            </Link>
          }
        />
      </div>
    </header>
  );
}
