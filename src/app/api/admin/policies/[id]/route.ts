import { parseBody } from "@/lib/api";
import { parseHardDelete, withAdmin } from "@/lib/admin-data/request";
import { adminFail, adminResult } from "@/lib/admin-data/responses";
import { prismaPolicyRepository } from "@/lib/admin-data/prisma";
import { deletePolicy, updatePolicy } from "@/lib/admin-data/services";
import { idParamSchema, patchPolicySchema } from "@/lib/admin-data/validation";

export const dynamic = "force-dynamic";

type RouteContext = { readonly params: Promise<{ readonly id: string }> };

export async function PATCH(req: Request, { params }: RouteContext) {
  return withAdmin({
    work: async () => {
      const id = idParamSchema.safeParse(await params);
      if (!id.success) return adminFail("Invalid policy id", 422);
      const body = await parseBody(req, patchPolicySchema);
      if (body.error) return adminFail("Invalid policy payload", 422);
      return adminResult(await updatePolicy(prismaPolicyRepository, id.data.id, body.data));
    },
  });
}

export async function DELETE(req: Request, { params }: RouteContext) {
  return withAdmin({
    work: async () => {
      const id = idParamSchema.safeParse(await params);
      if (!id.success) return adminFail("Invalid policy id", 422);
      const hard = parseHardDelete(req);
      if (hard === null) return adminFail("Invalid delete query", 422);
      return adminResult(await deletePolicy(prismaPolicyRepository, id.data.id, hard));
    },
  });
}
