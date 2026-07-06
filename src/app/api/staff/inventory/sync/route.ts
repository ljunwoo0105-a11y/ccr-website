import { ok, fail, guard } from "@/lib/api";
import { syncInventoryFromPos } from "@/lib/pos";

export const dynamic = "force-dynamic";

/** Pull stock levels from the POS into the parts price list. */
export async function POST() {
  const { error } = await guard();
  if (error) return error;

  try {
    const result = await syncInventoryFromPos();
    return ok(result);
  } catch (e) {
    return fail(
      e instanceof Error ? e.message : "Inventory sync failed",
      500
    );
  }
}
