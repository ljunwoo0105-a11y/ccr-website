import { guard, privateOk } from "@/lib/api";
import { pricingRepository } from "@/lib/pricing/prisma-repository";

export const dynamic = "force-dynamic";

/**
 * Active policy documents. STAFF-readable because the walk-in intake form
 * makes the customer acknowledge each one, and staff run intake at the
 * counter — they need the text they are asking the customer to accept.
 */
export async function GET() {
  const { error } = await guard();
  if (error) return error;

  const policies = await pricingRepository.listActivePolicies();
  return privateOk({ policies });
}
