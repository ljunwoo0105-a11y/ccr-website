import { withAdmin } from "@/lib/admin-data/request";
import { adminOk } from "@/lib/admin-data/responses";
import { db } from "@/lib/db";
import type { RepairFormListRow } from "@/components/admin/records-state";

export const dynamic = "force-dynamic";

export async function GET() {
  return withAdmin({
    work: async () => {
      const rows = await db.repairForm.findMany({
        orderBy: { updatedAt: "desc" },
        take: 100,
        select: {
          id: true,
          status: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          deviceType: true,
          brand: true,
          model: true,
          emailedAt: true,
          emailError: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const data: RepairFormListRow[] = rows.map((row) => ({
        id: row.id,
        status: row.status,
        customerName: row.customerName,
        customerEmail: row.customerEmail,
        customerPhone: row.customerPhone,
        deviceType: row.deviceType,
        brand: row.brand,
        model: row.model,
        emailedAt: row.emailedAt?.toISOString() ?? null,
        emailError: row.emailError,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));

      return adminOk(data);
    },
  });
}
