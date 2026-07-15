import { db } from "@/lib/db";
import { guard, privateFail, privateOk } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Staff-only device catalog WITH prices, for the in-store quote builder.
 * Guarded by guard() (STAFF) + middleware — never reachable from the public
 * site, so unlike /api/public/catalog it is allowed to return sell prices.
 *
 *   (no params)                          → { deviceTypes }
 *   ?deviceType                          → { brands }
 *   ?deviceType&brand                    → { models }
 *   ?deviceType&brand&model              → { repairTypes }
 *   ?deviceType&brand&model&repairType   → { parts: [{ id, quality, colour,
 *                                            sellPrice, warrantyDays, stockQty }] }
 */
export async function GET(req: Request) {
  const { error } = await guard();
  if (error) return error;

  try {
    const url = new URL(req.url);
    const deviceType = url.searchParams.get("deviceType")?.trim() ?? "";
    const brand = url.searchParams.get("brand")?.trim() ?? "";
    const model = url.searchParams.get("model")?.trim() ?? "";
    const repairType = url.searchParams.get("repairType")?.trim() ?? "";

    if (!deviceType) {
      const rows = await db.part.findMany({
        where: { active: true },
        distinct: ["deviceType"],
        select: { deviceType: true },
        orderBy: { deviceType: "asc" },
      });
      return privateOk({ deviceTypes: rows.map((r) => r.deviceType) });
    }
    if (!brand) {
      const rows = await db.part.findMany({
        where: { active: true, deviceType },
        distinct: ["brand"],
        select: { brand: true },
        orderBy: { brand: "asc" },
      });
      return privateOk({ brands: rows.map((r) => r.brand) });
    }
    if (!model) {
      const rows = await db.part.findMany({
        where: { active: true, deviceType, brand },
        distinct: ["model"],
        select: { model: true },
        orderBy: { model: "asc" },
      });
      return privateOk({ models: rows.map((r) => r.model) });
    }
    if (!repairType) {
      const rows = await db.part.findMany({
        where: { active: true, deviceType, brand, model },
        distinct: ["repairType"],
        select: { repairType: true },
        orderBy: { repairType: "asc" },
      });
      return privateOk({ repairTypes: rows.map((r) => r.repairType) });
    }

    const parts = await db.part.findMany({
      where: { active: true, deviceType, brand, model, repairType },
      select: {
        id: true,
        quality: true,
        colour: true,
        sellPrice: true,
        warrantyDays: true,
        stockQty: true,
      },
      orderBy: [{ sellPrice: "asc" }],
    });
    return privateOk({ parts });
  } catch {
    return privateFail("Something went wrong", 500);
  }
}
