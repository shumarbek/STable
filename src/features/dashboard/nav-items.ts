import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Receipt,
  CalendarDays,
  BarChart3,
  PieChart,
  Wallet,
  Target,
  User,
  Settings,
  RefreshCw,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Desktop sidebar navigation (spec section 11). */
export const desktopNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Tranzaksiyalar", icon: Receipt },
  { href: "/calendar", label: "Taqvim", icon: CalendarDays },
  { href: "/reports", label: "Hisobotlar", icon: BarChart3 },
  { href: "/analytics", label: "Analitika", icon: PieChart },
  { href: "/budgets", label: "Budjetlar", icon: Wallet },
  { href: "/goals", label: "Maqsadlar", icon: Target },
  { href: "/subscriptions", label: "Obunalar", icon: RefreshCw },
  { href: "/profile", label: "Profil", icon: User },
  { href: "/settings", label: "Sozlamalar", icon: Settings },
];

/** Mobile bottom navigation (spec section 11): Home, Calendar, Add, Reports, Profile. */
export const mobileNavItems: NavItem[] = [
  { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
  { href: "/calendar", label: "Taqvim", icon: CalendarDays },
  { href: "/reports", label: "Hisobot", icon: BarChart3 },
  { href: "/profile", label: "Profil", icon: User },
];
