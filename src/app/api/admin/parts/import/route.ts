import { z } from "zod";
import { guard, parseBody, privateOk, privateFail } from "@/lib/api";
import { importPriceList } from "@/lib/parts/import";

export const dynamic = "force-dynamic";

// ~600 KB of CSV comfortably covers the 1000-row import limit.
const importRequestSchema = z.object({
  csv: z.string().min(1).max(600_000),
  mode: z.enum(["preview", "apply"]),
});

/**
 * Price-list CSV import. ADMIN only — cost prices travel through here.
 * "preview" never writes; "apply" writes valid rows in one transaction and
 * both return the same per-row breakdown.
 */
export async function POST(req: Request) {
  const { error } = await guard("ADMIN");
  if (error) return error;

  const parsed = await parseBody(req, importRequestSchema);
  if (parsed.error) return parsed.error;

  const result = await importPriceList(parsed.data.csv, parsed.data.mode);
  if (!result.ok) {
    return privateFail(result.fileError ?? "Could not read the file", 422);
  }
  return privateOk(result);
}
