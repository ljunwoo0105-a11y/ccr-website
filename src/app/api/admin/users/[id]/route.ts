import { z } from "zod";
import { db } from "@/lib/db";
import { fail, guard, ok, parseBody } from "@/lib/api";

const updateUserSchema = z.object({
  active: z.boolean().optional(),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
});

/**
 * Activate/deactivate or change the role of an account.
 * Admins cannot deactivate or demote their own account (lockout protection).
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await guard("ADMIN");
  if (auth.error) return auth.error;

  const body = await parseBody(req, updateUserSchema);
  if (body.error) return body.error;
  const data = body.data;

  if (data.active === undefined && data.role === undefined) {
    return fail("Nothing to update", 400);
  }

  if (
    params.id === auth.user.id &&
    (data.active === false || data.role === "STAFF")
  ) {
    return fail("You can't deactivate or demote your own account", 409);
  }

  const target = await db.user.findUnique({ where: { id: params.id } });
  if (!target) return fail("User not found", 404);

  const updated = await db.user.update({
    where: { id: target.id },
    data: { active: data.active, role: data.role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
  return ok(updated);
}
