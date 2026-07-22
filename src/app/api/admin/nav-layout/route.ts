import { withAdmin, withAdminBody } from "@/lib/admin-data/request";
import { adminOk } from "@/lib/admin-data/responses";
import {
  getNavLayout,
  navLayoutSchema,
  saveNavLayout,
} from "@/lib/admin/nav-layout";

export const dynamic = "force-dynamic";

export async function GET() {
  return withAdmin({ work: async () => adminOk(await getNavLayout()) });
}

export async function PUT(req: Request) {
  return withAdminBody({
    req,
    schema: navLayoutSchema,
    invalidMessage: "Invalid menu layout payload",
    work: async (body) => adminOk(await saveNavLayout(body)),
  });
}
