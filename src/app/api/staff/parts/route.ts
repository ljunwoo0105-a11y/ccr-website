import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, parseBody, guard } from "@/lib/api";
import { partSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Price list. ADMIN gets full rows (cost prices, margins, suppliers, POS
 * links); STAFF gets only the sell-side fields the landing-page price list
 * renders, and only active parts — the cost/supplier columns are admin data
 * and must not leave the server for a STAFF session. This route is
 * session-guarded and must NEVER be proxied to a public surface.
 *
 * Query params:
 *   search=     contains-match on brand / model / repairType / sku
 *   deviceType= exact
 *   brand=      exact
 *   quality=    exact
 *   active=     "true" (default) | "false" | "all" — admin only; staff is
 *               always pinned to active parts
 */
const STAFF_PART_SELECT = {
  id: true,
  deviceType: true,
  brand: true,
  model: true,
  repairType: true,
  quality: true,
  colour: true,
  sellPrice: true,
  warrantyDays: true,
  stockQty: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET(req: Request) {
  const { user, error } = await guard();
  if (error) return error;
  const isAdmin = user.role === "ADMIN";

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() ?? "";
  const deviceType = url.searchParams.get("deviceType")?.trim() ?? "";
  const brand = url.searchParams.get("brand")?.trim() ?? "";
  const quality = url.searchParams.get("quality")?.trim() ?? "";
  const active = url.searchParams.get("active")?.trim() ?? "true";

  const where: Prisma.PartWhereInput = {};
  if (!isAdmin || active === "true") where.active = true;
  else if (active === "false") where.active = false;
  // admin "all" → no filter

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

  const orderBy: Prisma.PartOrderByWithRelationInput[] = [
    { brand: "asc" },
    { model: "asc" },
    { repairType: "asc" },
    { sellPrice: "asc" },
  ];

  if (!isAdmin) {
    return ok(await db.part.findMany({ where, orderBy, select: STAFF_PART_SELECT }));
  }
  return ok(await db.part.findMany({ where, orderBy }));
}

/** Create a part (price list row). */
export async function POST(req: Request) {
  const { error } = await guard("ADMIN");
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
