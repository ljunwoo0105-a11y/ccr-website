import { db } from "@/lib/db";
import { ok, fail, parseBody, guard } from "@/lib/api";
import { partUpdateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Partial update of a part (price edits, stock adjustments, reactivation). */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await guard();
  if (error) return error;

  const parsed = await parseBody(req, partUpdateSchema);
  if (parsed.error) return parsed.error;

  const existing = await db.part.findUnique({ where: { id: params.id } });
  if (!existing) return fail("Part not found", 404);

  const part = await db.part.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return ok(part);
}

/**
 * Soft delete (active=false). Admins may pass ?hard=1 to permanently remove
 * the row — staff requesting ?hard=1 silently fall back to a soft delete.
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { user, error } = await guard();
  if (error) return error;

  const existing = await db.part.findUnique({ where: { id: params.id } });
  if (!existing) return fail("Part not found", 404);

  const hard = new URL(req.url).searchParams.get("hard") === "1";
  if (hard && user.role === "ADMIN") {
    await db.part.delete({ where: { id: params.id } });
    return ok({ deleted: "hard" });
  }

  await db.part.update({
    where: { id: params.id },
    data: { active: false },
  });
  return ok({ deleted: "soft" });
}
