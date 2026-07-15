import { withAdmin } from "@/lib/admin-data/request";
import { adminFail, adminOk } from "@/lib/admin-data/responses";
import { prismaPriceAccessRepository } from "@/lib/admin-data/prisma";
import { listPriceAccessLogs } from "@/lib/admin-data/services";
import { priceAccessQuerySchema } from "@/lib/admin-data/validation";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withAdmin({
    work: async () => {
      const query = priceAccessQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
      if (!query.success) return adminFail("Invalid price access query", 422);
      return adminOk(await listPriceAccessLogs(prismaPriceAccessRepository, query.data.page, query.data.pageSize));
    },
  });
}
