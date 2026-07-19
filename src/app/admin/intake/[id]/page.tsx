import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { buildIntakeDetailAgreementProjection } from "@/lib/intakes/detail";
import { parseJsonStringArray } from "@/components/staff/types";
import { parsePreCondition } from "@/components/staff/precondition";
import IntakeActions from "@/components/staff/IntakeActions";
import { IntakeDetailAgreement } from "@/components/staff/intake/IntakeDetailAgreement";
import { IntakeDetailCondition } from "@/components/staff/intake/IntakeDetailCondition";
import { IntakeDetailHeader } from "@/components/staff/intake/IntakeDetailHeader";
import { IntakeDetailSummary } from "@/components/staff/intake/IntakeDetailSummary";

export const dynamic = "force-dynamic";

export const metadata = { title: "Intake Report", robots: { index: false } };

export default async function IntakeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const intake = await db.repairIntake.findUnique({
    where: { id },
    include: {
      customer: true,
      staff: { select: { name: true } },
    },
  });
  if (!intake) notFound();

  const repairs = parseJsonStringArray(intake.repairTypes);
  const preCondition = parsePreCondition(intake.preCondition);
  const agreement = buildIntakeDetailAgreementProjection({
    agreementSnapshot: intake.agreementSnapshot,
    policyAcknowledgements: intake.policyAcknowledgements,
    agreementAcceptedAt: intake.agreementAcceptedAt,
    warrantyDays: intake.warrantyDays,
  });

  return (
    <div className="space-y-6 print:space-y-4 print:text-[12px]">
      <IntakeDetailHeader
        id={intake.id}
        status={intake.status}
        createdAt={intake.createdAt}
      />
      <IntakeActions id={intake.id} status={intake.status} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 print:grid-cols-2 print:gap-4">
        <IntakeDetailSummary
          customer={intake.customer}
          device={{
            deviceType: intake.deviceType,
            brand: intake.brand,
            model: intake.model,
            imei: intake.imei,
            serialNo: intake.serialNo,
            accessories: intake.accessories,
          }}
          job={{
            repairs,
            partQuality: intake.partQuality,
            warrantyDays: intake.warrantyDays,
            quotedPrice: intake.quotedPrice,
            pricingSource: intake.pricingSource,
            matchedPartId: intake.matchedPartId,
            depositPaid: intake.depositPaid,
            status: intake.status,
            completedAt: intake.completedAt,
            staffName: intake.staff.name ?? "\u2014",
          }}
        />

        <div className="space-y-6 print:space-y-4">
          <IntakeDetailCondition
            preCondition={preCondition}
            conditionNotes={intake.conditionNotes}
          />
          <IntakeDetailAgreement
            agreement={agreement}
            customerSignature={intake.customerSignature}
            createdAt={intake.createdAt}
          />
        </div>
      </div>
    </div>
  );
}
