import { db } from "@/lib/db";
import { ok, fail, guard } from "@/lib/api";
import { sendEmail, renderQuoteEmail } from "@/lib/email";
import { findCheapestPart } from "@/lib/quotes";

export const dynamic = "force-dynamic";

/**
 * Re-send the estimate email for a lead, recomputing the cheapest-tier
 * "from" price with findCheapestPart() — the identical matching rule the
 * public quote route uses, so a resend can never quote a different price
 * than the original request would today. The email shows only the single
 * "from" figure — never the price list.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await guard();
  if (error) return error;

  const lead = await db.quoteRequest.findUnique({ where: { id: params.id } });
  if (!lead) return fail("Lead not found", 404);

  const part = await findCheapestPart({
    deviceType: lead.deviceType,
    brand: lead.brand,
    model: lead.model,
    repairType: lead.repairType,
  });

  const fromPrice = part ? part.sellPrice : lead.fromPriceAud ?? null;

  const { subject, html } = renderQuoteEmail({
    name: lead.name,
    brand: lead.brand,
    model: lead.model,
    repairType: lead.repairType,
    fromPrice,
  });

  try {
    await sendEmail({ to: lead.email, subject, html });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Email send failed";
    await db.quoteRequest.update({
      where: { id: lead.id },
      data: { emailError: message.slice(0, 500) },
    });
    return fail("Failed to send the estimate email", 500);
  }

  await db.quoteRequest.update({
    where: { id: lead.id },
    data: {
      status: "EMAILED",
      emailedAt: new Date(),
      emailError: null,
      fromPriceAud: fromPrice,
      partQuality: part ? part.quality : lead.partQuality,
    },
  });

  return ok({});
}
