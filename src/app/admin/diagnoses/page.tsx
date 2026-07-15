import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DiagnosesManager } from "@/components/admin/diagnoses-manager";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Diagnoses" };
export const dynamic = "force-dynamic";

export default async function AdminDiagnosesPage() {
  const user = await requireUser("ADMIN");
  if (!user) redirect("/staff/login");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-carbon-950">Diagnoses</h1>
        <p className="mt-1 text-sm text-carbon-500">
          Manage commercial diagnosis rules used by staff price matching and intake prefill.
        </p>
      </header>

      <DiagnosesManager />
    </div>
  );
}
