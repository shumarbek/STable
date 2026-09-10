"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "cn";
import { mobileNavItems } from "@/features/dashboard/nav-items";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [firstHalf, secondHalf] = [
    mobileNavItems.slice(0, 2),
    mobileNavItems.slice(2),
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur md:hidden">
      <div className="relative flex items-center justify-between px-4 py-2">
        <div className="flex flex-1 justify-around">
          {firstHalf.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} Icon={item.icon} pathname={pathname} />
          ))}
        </div>

        <Link
          href="/transactions/new"
          aria-label="Xarajat qo'shish"
          className="absolute left-1/2 top-0 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
        >
          <Plus className="size-6" />
        </Link>

        <div className="flex flex-1 justify-around">
          {secondHalf.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} Icon={item.icon} pathname={pathname} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  Icon,
  pathname,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  pathname: string;
}) {
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-0.5 px-2 py-1 text-xs",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}
