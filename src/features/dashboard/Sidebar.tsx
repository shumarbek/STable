"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import type { Profile } from "@/types/database";
import { desktopNavItems } from "@/features/dashboard/nav-items";
import { SidebarNavLink } from "@/features/dashboard/SidebarNavLink";
import { LogoutButton } from "@/features/dashboard/LogoutButton";

export function Sidebar({ profile }: { profile: Profile }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card md:flex">
      <div className="flex items-center gap-2 px-6 py-5">
        <Wallet className="size-6 text-primary" />
        <span className="font-heading text-lg font-semibold">STable</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {desktopNavItems.map((item) => (
          <SidebarNavLink key={item.href} item={item} />
        ))}
      </nav>

      <div className="border-t p-3">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted"
        >
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profile.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">
              ID: {profile.public_user_id}
            </p>
          </div>
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}
