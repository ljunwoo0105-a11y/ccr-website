import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, fail, parseBody, guard } from "@/lib/api";
import { intakeStatusSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Full intake record, including the customer and the staff member's name. */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await guard();
  if (error) return error;

  const intake = await db.repairIntake.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      staff: { select: { id: true, name: true } },
    },
  });
  if (!intake) return fail("Intake not found", 404);

  return ok(intake);
}

/** Status transitions; COLLECTED also stamps completedAt. */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await guard();
  if (error) return error;

  const parsed = await parseBody(req, intakeStatusSchema);
  if (parsed.error) return parsed.error;

  const existing = await db.repairIntake.findUnique({
    where: { id: params.id },
  });
  if (!existing) return fail("Intake not found", 404);

  const data: Prisma.RepairIntakeUpdateInput = { status: parsed.data.status };
  if (parsed.data.status === "COLLECTED") data.completedAt = new Date();

  const intake = await db.repairIntake.update({
    where: { id: params.id },
    data,
  });

  return ok(intake);
}
