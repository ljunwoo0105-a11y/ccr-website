import { guard, privateOk } from "@/lib/api";
import { pricingRepository } from "@/lib/pricing/prisma-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await guard();
  if (error) return error;

  const policies = await pricingRepository.listActivePolicies();
  return privateOk({ policies });
}
