import { withAdmin } from "@/lib/admin-data/request";
import { adminOk } from "@/lib/admin-data/responses";
import { db } from "@/lib/db";
import type { IntakeListRow } from "@/components/admin/records-state";

export const dynamic = "force-dynamic";

export async function GET() {
  return withAdmin({
    work: async () => {
      const rows = await db.repairIntake.findMany({
        orderBy: { updatedAt: "desc" },
        take: 100,
        select: {
          id: true,
          status: true,
          customer: {
            select: { name: true, phone: true, email: true },
          },
          deviceType: true,
          brand: true,
          model: true,
          repairTypes: true,
          agreementSnapshot: true,
          agreementAcceptedAt: true,
          preConditionAccuracyAccepted: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const data: IntakeListRow[] = rows.map((row) => ({
        id: row.id,
        status: row.status,
        customerName: row.customer.name,
        customerPhone: row.customer.phone,
        customerEmail: row.customer.email,
        deviceType: row.deviceType,
        brand: row.brand,
        model: row.model,
        repairTypes: row.repairTypes,
        agreementAcceptedAt: row.agreementAcceptedAt?.toISOString() ?? null,
        hasAgreementSnapshot: row.agreementSnapshot !== null,
        preConditionAccuracyAccepted: row.preConditionAccuracyAccepted,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));

      return adminOk(data);
    },
  });
}
