import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { CcrLogo } from "@/components/brand/CcrLogo";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";

export const metadata: Metadata = {
  title: { default: "Admin Console", template: "%s | CCR Admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser("ADMIN");
  if (!user) redirect("/staff/login");

  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col overflow-y-auto bg-slate-900 text-slate-300">
        <div className="flex items-center gap-2.5 border-b border-slate-800 px-5 py-5">
          <CcrLogo className="h-8 w-8" sizes="32px" />
          <span className="text-base font-bold tracking-tight text-white">
            CCR Admin
          </span>
        </div>
        <AdminNav />
        <div className="border-t border-slate-800 p-4">
          <div className="mb-2 flex items-center gap-3 px-1">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white"
            >
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user.name}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">{children}</main>
    </div>
  );
}
