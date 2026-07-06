import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { CcrLogo } from "@/components/brand/CcrLogo";
import SidebarNav from "@/components/staff/SidebarNav";
import LogoutButton from "@/components/staff/LogoutButton";

export const dynamic = "force-dynamic";

/**
 * Authenticated staff shell: dark sidebar, light content. The login page
 * sits outside this (portal) route group, so redirecting here can't loop.
 * Middleware screens these paths too — this is the DB-backed second check.
 */
export default async function StaffPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!user) redirect("/staff/login");

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col bg-slate-900 px-2 py-4 sm:w-60 sm:px-4 print:hidden">
        <div className="mb-6 flex items-center gap-3 px-1">
          <CcrLogo className="h-9 w-9" sizes="36px" />
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight tracking-wide text-white">
              CCR Staff
            </p>
            <p className="text-xs text-slate-400">Cool Case Repair</p>
          </div>
        </div>

        <SidebarNav isAdmin={user.role === "ADMIN"} />

        <div className="mt-auto border-t border-slate-800 pt-3">
          <div className="hidden px-3 pb-2 sm:block">
            <p className="truncate text-sm font-medium text-white">
              {user.name}
            </p>
            <span className="mt-1 inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
              {user.role}
            </span>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1 print:bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:p-0">
          {children}
        </div>
      </main>
    </div>
  );
}
