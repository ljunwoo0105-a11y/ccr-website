import { parseBody } from "@/lib/api";
import { withAdmin } from "@/lib/admin-data/request";
import { adminFail, adminResult } from "@/lib/admin-data/responses";
import { prismaRecordRepository } from "@/lib/admin-data/prisma";
import { deleteIntakeRecord, updateIntakeRecord } from "@/lib/admin-data/services";
import { idParamSchema, intakePatchSchema } from "@/lib/admin-data/validation";

export const dynamic = "force-dynamic";

type RouteContext = { readonly params: Promise<{ readonly id: string }> };

export async function PATCH(req: Request, { params }: RouteContext) {
  return withAdmin({
    work: async () => {
      const id = idParamSchema.safeParse(await params);
      if (!id.success) return adminFail("Invalid intake id", 422);
      const body = await parseBody(req, intakePatchSchema);
      if (body.error) return adminFail("Invalid intake payload", 422);
      return adminResult(await updateIntakeRecord(prismaRecordRepository, id.data.id, body.data));
    },
  });
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  return withAdmin({
    work: async () => {
      const id = idParamSchema.safeParse(await params);
      if (!id.success) return adminFail("Invalid intake id", 422);
      return adminResult(await deleteIntakeRecord(prismaRecordRepository, id.data.id));
    },
  });
}
