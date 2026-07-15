import { withAdminBody, withAdmin } from "@/lib/admin-data/request";
import { adminOk, adminResult } from "@/lib/admin-data/responses";
import { listPolicies, prismaPolicyRepository } from "@/lib/admin-data/prisma";
import { createPolicy } from "@/lib/admin-data/services";
import { createPolicySchema } from "@/lib/admin-data/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  return withAdmin({ work: async () => adminOk(await listPolicies()) });
}

export async function POST(req: Request) {
  return withAdminBody({
    req,
    schema: createPolicySchema,
    invalidMessage: "Invalid policy payload",
    work: async (body) => adminResult(await createPolicy(prismaPolicyRepository, body)),
  });
}
