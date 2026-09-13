"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutGrid, Plus, Receipt } from "lucide-react";
import { cn } from "cn";
import { desktopNavItems } from "@/features/dashboard/nav-items";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";

const leftItems = [
  desktopNavItems.find((item) => item.href === "/dashboard")!,
  { href: "/transactions", label: "Kirim va chiqim", icon: Receipt },
];
const calendarItem = { href: "/calendar", label: "Taqvim", icon: CalendarDays };
const primaryHrefs = new Set(["/dashboard", "/transactions", "/calendar"]);
const menuItems = desktopNavItems.filter((item) => !primaryHrefs.has(item.href));

export function MobileBottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Asosiy navigatsiya">
      <div className="relative grid h-[4.5rem] grid-cols-5 items-center px-1">
        {leftItems.map((item) => <NavLink key={item.href} {...item} pathname={pathname} />)}
        <div aria-hidden="true" />
        <NavLink {...calendarItem} pathname={pathname} />
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger render={
            <button type="button" className={cn("flex h-full flex-col items-center justify-center gap-0.5 px-1 text-[11px]", menuOpen ? "text-primary" : "text-muted-foreground")}>
              <LayoutGrid className="size-5" /><span>Menyu</span>
            </button>
          } />
          <SheetContent side="bottom" className="max-h-[80dvh] rounded-t-3xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <SheetHeader>
              <SheetTitle>Barcha bo‘limlar</SheetTitle>
              <SheetDescription>Kerakli sahifani tanlang</SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-2 px-4 pb-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return <Link key={item.href} href={item.href} prefetch={false} onClick={() => setMenuOpen(false)} className={cn("flex min-h-16 items-center gap-3 rounded-2xl border p-3 text-sm font-medium", active ? "border-primary bg-primary/5 text-primary" : "bg-background")}><Icon className="size-5 shrink-0" /><span className="leading-tight">{item.label}</span></Link>;
              })}
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/transactions/new" prefetch={false} aria-label="Chiqim qo‘shish" className="absolute left-1/2 top-0 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95">
          <Plus className="size-6" />
        </Link>
      </div>
    </nav>
  );
}

function NavLink({ href, label, icon: Icon, pathname }: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; pathname: string }) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return <Link href={href} prefetch={false} className={cn("flex h-full flex-col items-center justify-center gap-0.5 px-1 text-[11px]", active ? "text-primary" : "text-muted-foreground")}><Icon className="size-5 shrink-0" /><span className="max-w-full text-center leading-[1.05]">{label}</span></Link>;
}
