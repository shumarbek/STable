"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/actions";

export function LogoutButton() {
  return (
    <form action={logout} className="mt-1">
      <Button
        type="submit"
        variant="ghost"
        className="w-full justify-start gap-3 text-muted-foreground"
      >
        <LogOut className="size-4" />
        Chiqish
      </Button>
    </form>
  );
}
