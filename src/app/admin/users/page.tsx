import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { UsersManager } from "@/components/admin/users-manager";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await requireUser("ADMIN");
  if (!user) redirect("/staff/login");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          Staff and admin accounts for the portal. Passwords are generated
          server-side and only ever stored hashed.
        </p>
      </header>

      <UsersManager currentUserId={user.id} />
    </div>
  );
}
