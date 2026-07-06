import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Public device catalog for the quote wizard. Returns ONLY catalog names
 * derived from active parts — never prices, costs, qualities or stock.
 *
 *   (no params)                    → { deviceTypes: string[] }
 *   ?deviceType                    → { brands: string[] }
 *   ?deviceType&brand              → { models: string[] }
 *   ?deviceType&brand&model        → { repairTypes: string[] }
 */
export async function GET(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit("catalog:" + ip, 120, 60_000);
  if (!limited.ok) return fail("Too many requests", 429);

  try {
    const url = new URL(req.url);
    const deviceType = url.searchParams.get("deviceType")?.trim() ?? "";
    const brand = url.searchParams.get("brand")?.trim() ?? "";
    const model = url.searchParams.get("model")?.trim() ?? "";

    if (!deviceType) {
      const rows = await db.part.findMany({
        where: { active: true },
        distinct: ["deviceType"],
        select: { deviceType: true },
        orderBy: { deviceType: "asc" },
      });
      return ok({ deviceTypes: rows.map((r) => r.deviceType) });
    }

    if (!brand) {
      const rows = await db.part.findMany({
        where: { active: true, deviceType },
        distinct: ["brand"],
        select: { brand: true },
        orderBy: { brand: "asc" },
      });
      return ok({ brands: rows.map((r) => r.brand) });
    }

    if (!model) {
      const rows = await db.part.findMany({
        where: { active: true, deviceType, brand },
        distinct: ["model"],
        select: { model: true },
        orderBy: { model: "asc" },
      });
      return ok({ models: rows.map((r) => r.model) });
    }

    const rows = await db.part.findMany({
      where: { active: true, deviceType, brand, model },
      distinct: ["repairType"],
      select: { repairType: true },
      orderBy: { repairType: "asc" },
    });
    return ok({ repairTypes: rows.map((r) => r.repairType) });
  } catch {
    return fail("Something went wrong", 500);
  }
}
