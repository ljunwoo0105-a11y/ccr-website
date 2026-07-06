import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { fail, guard, ok, parseBody } from "@/lib/api";

const createUserSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  role: z.enum(["ADMIN", "STAFF"]),
});

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
} as const;

/** All accounts — passwordHash is never selected. */
export async function GET() {
  const { error } = await guard("ADMIN");
  if (error) return error;

  const users = await db.user.findMany({
    select: SAFE_USER_SELECT,
    orderBy: { createdAt: "asc" },
  });
  return ok(users);
}

/**
 * Create an account with a server-generated temporary password.
 * The password is returned ONCE in this response and never stored in plain text.
 */
export async function POST(req: Request) {
  const { error } = await guard("ADMIN");
  if (error) return error;

  const body = await parseBody(req, createUserSchema);
  if (body.error) return body.error;
  const data = body.data;

  const email = data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return fail("A user with that email already exists", 409);

  const tempPassword = randomBytes(9).toString("base64url"); // 12 chars
  const user = await db.user.create({
    data: {
      name: data.name,
      email,
      role: data.role,
      passwordHash: await hashPassword(tempPassword),
    },
    select: SAFE_USER_SELECT,
  });

  return ok({ user, tempPassword }, { status: 201 });
}
