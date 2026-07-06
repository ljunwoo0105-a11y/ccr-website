import { db } from "@/lib/db";
import { ok, guard } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Phone-number lookup for intake autofill. Returns up to 5 matches.
 * Requires at least 3 digits to avoid dumping the customer list.
 */
export async function GET(req: Request) {
  const { error } = await guard();
  if (error) return error;

  const phone = new URL(req.url).searchParams.get("phone")?.trim() ?? "";
  if (phone.length < 3) return ok([]);

  const customers = await db.customer.findMany({
    where: { phone: { contains: phone } },
    select: { id: true, name: true, phone: true, email: true, suburb: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return ok(customers);
}
