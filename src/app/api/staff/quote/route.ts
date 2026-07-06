import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, fail, parseBody, guard } from "@/lib/api";
import { repairFormSchema } from "@/lib/validation";
import { QUALITY_LABELS } from "@/lib/config";
import { applyDiscount } from "@/lib/utils";
import { renderRepairFormEmail, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function qualityLabel(quality: string): string {
  return QUALITY_LABELS[quality as keyof typeof QUALITY_LABELS] ?? quality;
}

/** List saved repair forms (most recent first), with their line items. */
export async function GET(req: Request) {
  const { error } = await guard();
  if (error) return error;

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() ?? "";

  const where: Prisma.RepairFormWhereInput = {};
  if (search) {
    where.OR = [
      { customerName: { contains: search } },
      { customerEmail: { contains: search } },
      { brand: { contains: search } },
      { model: { contains: search } },
    ];
  }

  const forms = await db.repairForm.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return ok(forms);
}

/**
 * Create a repair form for one device with one or more repair line items.
 * Every price and device fact is taken from the chosen catalog Parts
 * (server-authoritative) — the client never sets the price. All items must be
 * for the same device. The full itemised quote is emailed and saved.
 */
export async function POST(req: Request) {
  const { user, error } = await guard();
  if (error) return error;

  const parsed = await parseBody(req, repairFormSchema);
  if (parsed.error) return parsed.error;
  const data = parsed.data;

  const partIds = data.items.map((i) => i.partId);
  const parts = await db.part.findMany({ where: { id: { in: partIds } } });
  const partMap = new Map(parts.map((p) => [p.id, p]));

  // Every chosen part must exist and be active.
  for (const it of data.items) {
    const p = partMap.get(it.partId);
    if (!p || !p.active) {
      return fail("One or more selected parts are not available", 404);
    }
  }

  // All line items must be for the same device.
  const first = partMap.get(data.items[0]!.partId)!;
  for (const it of data.items) {
    const p = partMap.get(it.partId)!;
    if (
      p.deviceType !== first.deviceType ||
      p.brand !== first.brand ||
      p.model !== first.model
    ) {
      return fail("All repairs must be for the same device", 422);
    }
  }

  const itemData = data.items.map((it) => {
    const p = partMap.get(it.partId)!;
    const colour =
      p.colour ?? (it.colour && it.colour.trim() ? it.colour.trim() : null);
    const discountType = it.discountType ?? null;
    const discountValue = discountType ? (it.discountValue ?? null) : null;
    return {
      repairType: p.repairType,
      quality: p.quality,
      colour,
      part: { connect: { id: p.id } },
      sellPrice: p.sellPrice,
      discountType,
      discountValue,
      warrantyDays: p.warrantyDays,
    };
  });
  const total =
    Math.round(
      data.items.reduce((sum, it) => {
        const p = partMap.get(it.partId)!;
        return (
          sum + applyDiscount(p.sellPrice, it.discountType, it.discountValue)
        );
      }, 0) * 100
    ) / 100;

  const form = await db.repairForm.create({
    data: {
      staffId: user.id,
      customerName: data.customer.name,
      customerEmail: data.customer.email,
      customerPhone:
        data.customer.phone && data.customer.phone.trim()
          ? data.customer.phone.trim()
          : null,
      deviceType: first.deviceType,
      brand: first.brand,
      model: first.model,
      total,
      preCondition: data.preCondition
        ? JSON.stringify(data.preCondition)
        : null,
      conditionNotes:
        data.conditionNotes && data.conditionNotes.trim()
          ? data.conditionNotes.trim()
          : null,
      items: { create: itemData },
    },
    include: { items: true },
  });

  let emailed = false;
  let emailError: string | null = null;
  if (data.sendEmail !== false) {
    try {
      const { subject, html } = renderRepairFormEmail({
        name: form.customerName,
        brand: form.brand,
        model: form.model,
        items: form.items.map((i) => ({
          repairType: i.repairType,
          qualityLabel: qualityLabel(i.quality),
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
      emailed = true;
      await db.repairForm.update({
        where: { id: form.id },
        data: { status: "EMAILED", emailedAt: new Date(), emailError: null },
      });
    } catch (e) {
      emailError =
        e instanceof Error ? e.message.slice(0, 300) : "Email failed";
      await db.repairForm.update({
        where: { id: form.id },
        data: { emailError },
      });
    }
  }

  return ok({ id: form.id, total: form.total, emailed, emailError });
}
