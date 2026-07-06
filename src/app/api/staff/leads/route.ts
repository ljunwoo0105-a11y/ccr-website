import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, guard } from "@/lib/api";

export const dynamic = "force-dynamic";

const LEAD_STATUSES = ["NEW", "EMAILED", "CONTACTED", "BOOKED", "CLOSED"];

/**
 * List quote leads. Staff can see the emailed "from" price — it never
 * appears on any public surface.
 *   status= one of the lead statuses (anything else → all)
 *   search= contains-match on name/email/phone/model
 */
export async function GET(req: Request) {
  const { error } = await guard();
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status")?.trim() ?? "";
  const search = url.searchParams.get("search")?.trim() ?? "";

  const where: Prisma.QuoteRequestWhereInput = {};
  if (LEAD_STATUSES.includes(status)) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { model: { contains: search } },
    ];
  }

  const leads = await db.quoteRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return ok(leads);
}
