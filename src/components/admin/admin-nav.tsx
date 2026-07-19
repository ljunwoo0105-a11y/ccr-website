"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Boxes,
  Calculator,
  ClipboardList,
  FileText,
  Inbox,
  LayoutDashboard,
  PackageSearch,
  ShieldCheck,
  Star,
  Stethoscope,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
  /** Match exactly, so a section root isn't lit up by every child page. */
  readonly exact?: boolean;
};

/**
 * One console. The staff portal folded in here when staff lost back-office
 * access, so this is grouped by what the work IS — running jobs versus
 * configuring the shop — rather than by which surface used to own it.
 */
const GROUPS: readonly {
  readonly title: string;
  readonly items: readonly NavItem[];
}[] = [
  {
    title: "Operations",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/admin/workshop", label: "Workshop", icon: Wrench },
      { href: "/admin/intake", label: "Customer Intake", icon: ClipboardList },
      { href: "/admin/quote", label: "Quote Builder", icon: Calculator },
      { href: "/admin/leads", label: "Quote Leads", icon: Inbox },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes },
    ],
  },
  {
    title: "Manage",
    items: [
      { href: "/admin/catalog", label: "Catalog & Pricing", icon: PackageSearch },
      { href: "/admin/diagnoses", label: "Diagnoses", icon: Stethoscope },
      { href: "/admin/policies", label: "Policies", icon: FileText },
      { href: "/admin/records", label: "Records", icon: ClipboardList },
      { href: "/admin/price-access", label: "Price Access", icon: ShieldCheck },
      { href: "/admin/ai", label: "AI Console", icon: Bot },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/users", label: "Users", icon: Users },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();

  function isActive(item: NavItem): boolean {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return (
    <nav className="flex-1 space-y-4 px-3 py-4" aria-label="Console navigation">
      {GROUPS.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-1.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-bone-100/40">
            {group.title}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-signal-500 text-carbon-950"
                      : "text-bone-100/70 hover:bg-carbon-900 hover:text-bone-100"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
