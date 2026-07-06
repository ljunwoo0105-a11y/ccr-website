import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, parseBody, guard } from "@/lib/api";
import { partSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Staff price list. Cost prices are returned here by design — this route is
 * session-guarded and must NEVER be proxied to a public surface.
 *
 * Query params:
 *   search=     contains-match on brand / model / repairType / sku
 *   deviceType= exact
 *   brand=      exact
 *   quality=    exact
 *   active=     "true" (default) | "false" | "all"
 */
export async function GET(req: Request) {
  const { error } = await guard();
  if (error) return error;

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() ?? "";
  const deviceType = url.searchParams.get("deviceType")?.trim() ?? "";
  const brand = url.searchParams.get("brand")?.trim() ?? "";
  const quality = url.searchParams.get("quality")?.trim() ?? "";
  const active = url.searchParams.get("active")?.trim() ?? "true";

  const where: Prisma.PartWhereInput = {};
  if (active === "true") where.active = true;
  else if (active === "false") where.active = false;
  // "all" → no filter

  if (deviceType) where.deviceType = deviceType;
  if (brand) where.brand = brand;
  if (quality) where.quality = quality;
  if (search) {
    where.OR = [
      { brand: { contains: search } },
      { model: { contains: search } },
      { repairType: { contains: search } },
      { sku: { contains: search } },
    ];
  }

  const parts = await db.part.findMany({
    where,
    orderBy: [
      { brand: "asc" },
      { model: "asc" },
      { repairType: "asc" },
      { sellPrice: "asc" },
    ],
  });

  return ok(parts);
}

/** Create a part (price list row). */
export async function POST(req: Request) {
  const { error } = await guard();
  if (error) return error;

  const parsed = await parseBody(req, partSchema);
  if (parsed.error) return parsed.error;
  const data = parsed.data;

  const part = await db.part.create({
    data: {
      deviceType: data.deviceType,
      brand: data.brand,
      model: data.model,
      repairType: data.repairType,
      quality: data.quality,
      colour: data.colour ?? null,
      costPrice: data.costPrice,
      sellPrice: data.sellPrice,
      warrantyDays: data.warrantyDays,
      stockQty: data.stockQty,
      sku: data.sku ?? null,
      supplier: data.supplier ?? null,
      posItemId: data.posItemId ?? null,
      notes: data.notes ?? null,
      active: data.active ?? true,
    },
  });

  return ok(part);
}
