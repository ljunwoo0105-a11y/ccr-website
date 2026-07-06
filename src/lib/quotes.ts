import "server-only";
import { db } from "@/lib/db";

/**
 * The single matching rule for "from" estimates: cheapest ACTIVE part with an
 * EXACT deviceType/brand/model/repairType match. Used by the public quote
 * endpoint and the staff resend endpoint so both always agree on the price a
 * customer is shown. (Exact matching is deliberate — a "contains" match would
 * let a lead for "iPhone 15" pick up cheaper "iPhone 15 Pro" parts.)
 */
export async function findCheapestPart(criteria: {
  deviceType: string;
  brand: string;
  model: string;
  repairType: string;
}) {
  return db.part.findFirst({
    where: {
      active: true,
      deviceType: criteria.deviceType,
      brand: criteria.brand,
      model: criteria.model,
      repairType: criteria.repairType,
    },
    orderBy: { sellPrice: "asc" },
  });
}
