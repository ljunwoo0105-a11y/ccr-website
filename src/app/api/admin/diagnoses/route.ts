import { withAdminBody, withAdmin } from "@/lib/admin-data/request";
import { adminOk, adminResult } from "@/lib/admin-data/responses";
import { listDiagnoses, prismaDiagnosisRepository } from "@/lib/admin-data/prisma";
import { createDiagnosis } from "@/lib/admin-data/services";
import { createDiagnosisSchema } from "@/lib/admin-data/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  return withAdmin({ work: async () => adminOk(await listDiagnoses()) });
}

export async function POST(req: Request) {
  return withAdminBody({
    req,
    schema: createDiagnosisSchema,
    invalidMessage: "Invalid diagnosis payload",
    work: async (body) => adminResult(await createDiagnosis(prismaDiagnosisRepository, body)),
  });
}
