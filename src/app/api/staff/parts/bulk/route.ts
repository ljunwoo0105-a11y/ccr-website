import { ok, parseBody, guard } from "@/lib/api";
import { prismaPartRepository } from "@/lib/parts/prisma";
import { bulkMutateParts } from "@/lib/parts/service";
import { partBulkSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Apply one action to many parts at once. ADMIN only, like every other
 * catalog mutation.
 *
 * Always 200 with a per-id breakdown rather than failing the whole request:
 * a hard delete over a mixed selection legitimately succeeds for some parts
 * and is refused for others still referenced by repair records, and the
 * caller needs to know which is which.
 */
export async function POST(req: Request) {
  const { error } = await guard("ADMIN");
  if (error) return error;

  const parsed = await parseBody(req, partBulkSchema);
  if (parsed.error) return parsed.error;

  const { ids, action } = parsed.data;
  const result = await bulkMutateParts(
    prismaPartRepository,
    [...new Set(ids)],
    action
  );

  return ok(result);
}
