import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, fail, parseBody, guard } from "@/lib/api";
import { intakeStatusSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Status transitions; COLLECTED also stamps completedAt. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await guard("ADMIN");
  if (error) return error;
  const { id } = await params;

  const parsed = await parseBody(req, intakeStatusSchema);
  if (parsed.error) return parsed.error;

  const existing = await db.repairIntake.findUnique({
    where: { id },
  });
  if (!existing) return fail("Intake not found", 404);

  const data: Prisma.RepairIntakeUpdateInput = { status: parsed.data.status };
  if (parsed.data.status === "COLLECTED") data.completedAt = new Date();

  const intake = await db.repairIntake.update({
    where: { id },
    data,
  });

  return ok(intake);
}
