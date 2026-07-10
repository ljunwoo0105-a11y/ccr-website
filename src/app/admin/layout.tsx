import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
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
    <div className="flex min-h-screen bg-bone-100">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col overflow-y-auto bg-carbon-950 text-bone-100/70">
        <div className="flex items-center gap-2.5 border-b border-bone-100/15 px-5 py-5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-signal-500 bg-bone-100 font-display text-base leading-none text-carbon-950"
            aria-hidden="true"
          >
            CCR
          </span>
          <span className="font-display text-base uppercase tracking-wide text-bone-100">
            CCR Admin
          </span>
        </div>
        <AdminNav />
        <div className="border-t border-bone-100/15 p-4">
          <div className="mb-2 flex items-center gap-3 px-1">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-carbon-800 text-xs font-bold text-bone-100"
            >
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-bone-100">
                {user.name}
              </p>
              <p className="truncate text-xs text-bone-100/50">{user.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">{children}</main>
    </div>
  );
}
