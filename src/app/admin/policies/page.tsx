import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PoliciesManager } from "@/components/admin/policies-manager";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Policies" };
export const dynamic = "force-dynamic";

export default async function AdminPoliciesPage() {
  const user = await requireUser("ADMIN");
  if (!user) redirect("/staff/login");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-carbon-950">Policies</h1>
        <p className="mt-1 text-sm text-carbon-500">
          Manage versioned agreement documents for intake terms, warranty, and data handling.
        </p>
      </header>

      <PoliciesManager />
    </div>
  );
}
