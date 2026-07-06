import { db } from "@/lib/db";
import { ok, fail, parseBody, guard } from "@/lib/api";
import { leadStatusSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Update a quote lead's pipeline status. */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await guard();
  if (error) return error;

  const parsed = await parseBody(req, leadStatusSchema);
  if (parsed.error) return parsed.error;

  const existing = await db.quoteRequest.findUnique({
    where: { id: params.id },
  });
  if (!existing) return fail("Lead not found", 404);

  const lead = await db.quoteRequest.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  return ok(lead);
}
