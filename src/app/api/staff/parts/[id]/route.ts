import { ok, fail, parseBody, guard } from "@/lib/api";
import { prismaPartRepository } from "@/lib/parts/prisma";
import {
  deletePart,
  partMutationResponse,
  runPartAdminMutation,
  updatePart,
} from "@/lib/parts/service";
import { partUpdateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Partial update of a part (price edits, stock adjustments, reactivation). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return runPartAdminMutation({
    guard,
    work: async () => {
      const { id } = await params;
      const parsed = await parseBody(req, partUpdateSchema);
      if (parsed.error) return parsed.error;
      const result = await updatePart(prismaPartRepository, id, parsed.data);
      return partMutationResponse(result, { ok, fail });
    },
  });
}

/**
 * Soft delete (active=false). Admins may pass ?hard=1 to permanently remove
 * an inactive row that is not referenced by repair records.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return runPartAdminMutation({
    guard,
    work: async () => {
      const { id } = await params;
      const hard = new URL(req.url).searchParams.get("hard") === "1";
      const result = await deletePart(prismaPartRepository, id, hard);
      return partMutationResponse(result, { ok, fail });
    },
  });
}
