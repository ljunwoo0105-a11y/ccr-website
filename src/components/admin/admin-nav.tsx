"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Bot, LayoutDashboard, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/ai", label: "AI Console", icon: Bot },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/users", label: "Users", icon: Users },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Admin navigation">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
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
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        );
      })}
      <div className="my-3 border-t border-bone-100/15" aria-hidden />
      <Link
        href="/staff"
        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-bone-100/70 transition-colors hover:bg-carbon-900 hover:text-bone-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Staff Portal
      </Link>
    </nav>
  );
}
