import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Receipt,
  CalendarDays,
  BarChart3,
  PieChart,
  Wallet,
  User,
  Settings,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Desktop sidebar navigation (spec section 11). */
export const desktopNavItems: NavItem[] = [
  { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
  { href: "/transactions", label: "Kirim va chiqimlar", icon: Receipt },
  { href: "/calendar", label: "Taqvim", icon: CalendarDays },
  { href: "/reports", label: "Hisobotlar", icon: BarChart3 },
  { href: "/analytics", label: "Analitika", icon: PieChart },
  { href: "/budgets", label: "Balans", icon: Wallet },
  { href: "/profile", label: "Profil", icon: User },
  { href: "/settings", label: "Sozlamalar", icon: Settings },
];

