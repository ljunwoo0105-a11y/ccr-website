import { parseBody } from "@/lib/api";
import { withAdmin } from "@/lib/admin-data/request";
import { adminFail, adminResult } from "@/lib/admin-data/responses";
import { prismaRecordRepository } from "@/lib/admin-data/prisma";
import { deleteRepairFormRecord, updateRepairFormRecord } from "@/lib/admin-data/services";
import { idParamSchema, repairFormPatchSchema } from "@/lib/admin-data/validation";

export const dynamic = "force-dynamic";

type RouteContext = { readonly params: Promise<{ readonly id: string }> };

export async function PATCH(req: Request, { params }: RouteContext) {
  return withAdmin({
    work: async () => {
      const id = idParamSchema.safeParse(await params);
      if (!id.success) return adminFail("Invalid repair form id", 422);
      const body = await parseBody(req, repairFormPatchSchema);
      if (body.error) return adminFail("Invalid repair form payload", 422);
      return adminResult(await updateRepairFormRecord(prismaRecordRepository, id.data.id, body.data));
    },
  });
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  return withAdmin({
    work: async () => {
      const id = idParamSchema.safeParse(await params);
      if (!id.success) return adminFail("Invalid repair form id", 422);
      return adminResult(await deleteRepairFormRecord(prismaRecordRepository, id.data.id));
    },
  });
}
