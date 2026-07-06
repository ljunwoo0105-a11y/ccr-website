import { db } from "@/lib/db";
import { ok, fail, guard } from "@/lib/api";
import { QUALITY_LABELS } from "@/lib/config";
import { renderRepairFormEmail, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/** Re-email a saved repair form (with all its line items) to its customer. */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await guard();
  if (error) return error;

  const form = await db.repairForm.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!form) return fail("Repair form not found", 404);

  try {
    const { subject, html } = renderRepairFormEmail({
      name: form.customerName,
      brand: form.brand,
      model: form.model,
      items: form.items.map((i) => ({
        repairType: i.repairType,
        qualityLabel:
          QUALITY_LABELS[i.quality as keyof typeof QUALITY_LABELS] ?? i.quality,
        colour: i.colour,
        warrantyDays: i.warrantyDays,
        listPrice: i.sellPrice,
        discountType: i.discountType,
        discountValue: i.discountValue,
      })),
      total: form.total,
      conditionNotes: form.conditionNotes,
    });
    await sendEmail({ to: form.customerEmail, subject, html });
    await db.repairForm.update({
      where: { id: form.id },
      data: { status: "EMAILED", emailedAt: new Date(), emailError: null },
    });
    return ok({ emailed: true });
  } catch (e) {
    const emailError =
      e instanceof Error ? e.message.slice(0, 300) : "Email failed";
    await db.repairForm.update({
      where: { id: form.id },
      data: { emailError },
    });
    return fail("Could not send email", 502);
  }
}
