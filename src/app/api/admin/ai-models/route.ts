import { db } from "@/lib/db";
import { fail, guard, ok, parseBody } from "@/lib/api";
import { aiModelSchema } from "@/lib/validation";

/** List all registry models (admin only — pricing is internal). */
export async function GET() {
  const { error } = await guard("ADMIN");
  if (error) return error;

  const models = await db.aiModel.findMany({ orderBy: { label: "asc" } });
  return ok(models);
}

/** Add a model to the registry. */
export async function POST(req: Request) {
  const { error } = await guard("ADMIN");
  if (error) return error;

  const body = await parseBody(req, aiModelSchema);
  if (body.error) return body.error;
  const data = body.data;

  const existing = await db.aiModel.findUnique({
    where: { modelId: data.modelId },
  });
  if (existing) return fail("A model with that model id already exists", 409);

  const model = await db.aiModel.create({
    data: {
      label: data.label,
      modelId: data.modelId,
      inputPerMTok: data.inputPerMTok,
      outputPerMTok: data.outputPerMTok,
      enabled: data.enabled ?? true,
      notes: data.notes ?? null,
    },
  });
  return ok(model, { status: 201 });
}
