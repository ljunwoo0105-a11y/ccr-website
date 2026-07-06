"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calculator,
  Tags,
  ClipboardList,
  Boxes,
  Inbox,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match the dashboard exactly so it isn't highlighted on every page. */
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/staff", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/staff/quote", label: "Quote Builder", icon: Calculator },
  { href: "/staff/price-list", label: "Price List", icon: Tags },
  { href: "/staff/intake", label: "Customer Intake", icon: ClipboardList },
  { href: "/staff/inventory", label: "Inventory", icon: Boxes },
  { href: "/staff/leads", label: "Quote Leads", icon: Inbox },
];

export default function SidebarNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  function isActive(item: NavItem): boolean {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return (
    <nav className="flex flex-col gap-1" aria-label="Staff navigation">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-ccr-primary text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
      {isAdmin && (
        <Link
          href="/admin"
          className="mt-2 flex items-center gap-3 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-amber-300 transition hover:bg-slate-800"
        >
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Admin Console</span>
        </Link>
      )}
    </nav>
  );
}
