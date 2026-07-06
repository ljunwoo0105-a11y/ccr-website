import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, parseBody, guard } from "@/lib/api";
import { intakeSchema } from "@/lib/validation";
import { QUALITY_DEFAULT_WARRANTY } from "@/lib/config";

export const dynamic = "force-dynamic";

const INTAKE_STATUSES = [
  "CHECKED_IN",
  "IN_REPAIR",
  "READY",
  "COLLECTED",
  "CANCELLED",
];

/**
 * List repair intakes.
 *   status= one of the intake statuses (anything else → all)
 *   search= contains-match on customer name/phone and device brand/model
 */
export async function GET(req: Request) {
  const { error } = await guard();
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status")?.trim() ?? "";
  const search = url.searchParams.get("search")?.trim() ?? "";

  const where: Prisma.RepairIntakeWhereInput = {};
  if (INTAKE_STATUSES.includes(status)) where.status = status;
  if (search) {
    where.OR = [
      { brand: { contains: search } },
      { model: { contains: search } },
      { customer: { name: { contains: search } } },
      { customer: { phone: { contains: search } } },
    ];
  }

  const intakes = await db.repairIntake.findMany({
    where,
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return ok(intakes);
}

/**
 * Create a repair intake (pre-repair condition record). Reuses an existing
 * customer when the phone number matches exactly, otherwise creates one.
 */
export async function POST(req: Request) {
  const { user, error } = await guard();
  if (error) return error;

  const parsed = await parseBody(req, intakeSchema);
  if (parsed.error) return parsed.error;
  const data = parsed.data;

  let customer = await db.customer.findFirst({
    where: { phone: data.customer.phone },
  });
  if (!customer) {
    customer = await db.customer.create({
      data: {
        name: data.customer.name,
        phone: data.customer.phone,
        email: data.customer.email ? data.customer.email : null,
        suburb: data.customer.suburb ? data.customer.suburb : null,
      },
    });
  }

  const warrantyDays =
    data.warrantyDays ??
    (data.partQuality
      ? QUALITY_DEFAULT_WARRANTY[data.partQuality] ?? null
      : null);

  const intake = await db.repairIntake.create({
    data: {
      customerId: customer.id,
      staffId: user.id,
      deviceType: data.deviceType,
      brand: data.brand,
      model: data.model,
      imei: data.imei ? data.imei : null,
      serialNo: data.serialNo ? data.serialNo : null,
      repairTypes: JSON.stringify(data.repairTypes),
      preCondition: JSON.stringify(data.preCondition),
      accessories: data.accessories ? data.accessories : null,
      conditionNotes: data.conditionNotes ? data.conditionNotes : null,
      partQuality: data.partQuality ?? null,
      warrantyDays,
      quotedPrice: data.quotedPrice ?? null,
      depositPaid: data.depositPaid ?? null,
      customerSignature: data.customerSignature,
    },
  });

  return ok({ id: intake.id });
}
