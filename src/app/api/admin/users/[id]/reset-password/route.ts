import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { fail, guard, ok } from "@/lib/api";

/**
 * Reset an account's password to a fresh server-generated temporary password.
 * Returned ONCE in this response — it is only ever stored as a bcrypt hash.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await guard("ADMIN");
  if (error) return error;

  const target = await db.user.findUnique({ where: { id: params.id } });
  if (!target) return fail("User not found", 404);

  const tempPassword = randomBytes(9).toString("base64url"); // 12 chars
  await db.user.update({
    where: { id: target.id },
    data: { passwordHash: await hashPassword(tempPassword) },
  });

  return ok({ tempPassword });
}
