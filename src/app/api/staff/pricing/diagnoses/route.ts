import { z } from "zod";
import { guard, privateFail, privateOk } from "@/lib/api";
import { pricingRepository } from "@/lib/pricing/prisma-repository";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  deviceType: z.string().trim().min(1).max(80),
  brand: z.string().trim().min(1).max(120),
  model: z.string().trim().min(1).max(160),
});

export async function GET(req: Request) {
  const { error } = await guard();
  if (error) return error;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    deviceType: url.searchParams.get("deviceType") ?? "",
    brand: url.searchParams.get("brand") ?? "",
    model: url.searchParams.get("model") ?? "",
  });
  if (!parsed.success) return privateFail("Invalid diagnosis lookup", 422);

  const rules = await pricingRepository.listApplicableDiagnosisRules(parsed.data);
  return privateOk({ diagnoses: rules });
}
