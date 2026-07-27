"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bot,
  Boxes,
  ClipboardList,
  FileText,
  Inbox,
  LayoutDashboard,
  PackageSearch,
  Settings2,
  ShieldCheck,
  Star,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminNavEditor } from "./admin-nav-editor";

/**
 * The layout (category names + which sections sit where) comes from the
 * server — it's owner-editable and persisted as a Setting. Labels and icons
 * stay here: icons are components and cannot cross the RSC boundary, and
 * section labels are part of the product, not the arrangement.
 */

// Mirrors NavLayout in src/lib/admin/nav-layout.ts, which is server-only and
// therefore cannot be imported from this client component.
export interface AdminNavGroup {
  readonly id: string;
  readonly title: string;
  readonly items: readonly string[];
}

export interface AdminNavLayout {
  readonly groups: readonly AdminNavGroup[];
}

type NavMeta = {
  readonly label: string;
  readonly icon: LucideIcon;
  /** Match exactly, so a section root isn't lit up by every child page. */
  readonly exact?: boolean;
};

export const NAV_META: Record<string, NavMeta> = {
  "/admin": { label: "Dashboard", icon: LayoutDashboard, exact: true },
  "/admin/intake": { label: "Customer Intake", icon: ClipboardList },
  "/admin/leads": { label: "Quote Leads", icon: Inbox },
  "/admin/inventory": { label: "Inventory", icon: Boxes },
  "/admin/catalog": { label: "Catalog & Pricing", icon: PackageSearch },
  "/admin/diagnoses": { label: "Diagnoses", icon: Stethoscope },
  "/admin/policies": { label: "Policies", icon: FileText },
  "/admin/records": { label: "Records", icon: ClipboardList },
  "/admin/price-access": { label: "Price Access", icon: ShieldCheck },
  "/admin/ai": { label: "AI Console", icon: Bot },
  "/admin/reviews": { label: "Reviews", icon: Star },
  "/admin/users": { label: "Users", icon: Users },
};

export function AdminNav({ layout }: { layout: AdminNavLayout }) {
  const pathname = usePathname();
  const [editing, setEditing] = useState(false);

  function isActive(href: string): boolean {
    if (NAV_META[href]?.exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <nav className="flex-1 space-y-4 px-3 py-4" aria-label="Console navigation">
        {layout.groups.map((group) => {
          const items = group.items.filter((href) => NAV_META[href]);
          if (items.length === 0) return null;
          return (
            <div key={group.id}>
              <p className="px-3 pb-1.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-bone-100/40">
                {group.title}
              </p>
              <div className="space-y-1">
                {items.map((href) => {
                  const meta = NAV_META[href];
                  const Icon = meta.icon;
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-signal-500 text-carbon-950"
                          : "text-bone-100/70 hover:bg-carbon-900 hover:text-bone-100"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      {meta.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex w-full items-center gap-3 px-3 py-2 text-xs font-medium text-bone-100/40 transition-colors hover:bg-carbon-900 hover:text-bone-100"
        >
          <Settings2 className="h-4 w-4 shrink-0" aria-hidden />
          Customise menu
        </button>
      </nav>
      {editing ? (
        <AdminNavEditor layout={layout} onClose={() => setEditing(false)} />
      ) : null}
    </>
  );
}
