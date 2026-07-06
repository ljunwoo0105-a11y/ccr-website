import { ok, guard } from "@/lib/api";
import { getPosAdapter } from "@/lib/pos";

export const dynamic = "force-dynamic";

/**
 * POS connectivity check. Configuration problems (unknown provider, missing
 * token) are reported as ok:false payloads rather than HTTP errors so the
 * staff UI can render them inline.
 */
export async function GET() {
  const { error } = await guard();
  if (error) return error;

  try {
    const adapter = getPosAdapter();
    const result = await adapter.testConnection();
    return ok(result);
  } catch (e) {
    return ok({
      ok: false,
      message:
        e instanceof Error ? e.message : "POS connection test failed",
    });
  }
}
