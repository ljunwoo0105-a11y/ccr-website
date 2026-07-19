import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import SidebarNav from "@/components/staff/SidebarNav";
import LogoutButton from "@/components/staff/LogoutButton";

export const dynamic = "force-dynamic";

/**
 * Authenticated back-office shell: dark sidebar, light content. Admin-only —
 * STAFF sessions see pricing on the public landing page instead, so they are
 * sent to "/". The login page sits outside this (portal) route group, so
 * redirecting here can't loop. Middleware screens these paths too — this is
 * the DB-backed second check.
 */
export default async function StaffPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!user) redirect("/staff/login");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen bg-bone-100 text-carbon-950">
      <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col border-r border-carbon-950 bg-carbon-950 px-2 py-4 sm:w-60 sm:px-4 print:hidden">
        <div className="mb-6 flex items-center gap-3 px-1">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-signal-500 bg-bone-100 font-display text-lg leading-none text-carbon-950"
            aria-hidden="true"
          >
            CCR
          </span>
          <div className="hidden sm:block">
            <p className="font-display text-sm uppercase leading-tight tracking-wide text-bone-100">
              CCR Staff
            </p>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-bone-100/50">
              Field Service Console
            </p>
          </div>
        </div>

        <SidebarNav isAdmin={user.role === "ADMIN"} />

        <div className="mt-auto border-t border-bone-100/15 pt-3">
          <div className="hidden px-3 pb-2 sm:block">
            <p className="truncate text-sm font-medium text-bone-100">
              {user.name}
            </p>
            <span className="mt-1 inline-flex items-center border border-bone-100/25 px-2 py-0.5 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-bone-100/75">
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
