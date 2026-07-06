import { db, getSetting } from "@/lib/db";
import { fail, guard, ok, parseBody } from "@/lib/api";
import { aiModelSchema } from "@/lib/validation";

const aiModelPatchSchema = aiModelSchema.partial();

/** Update a registry model (any subset of fields, including the enabled toggle). */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await guard("ADMIN");
  if (error) return error;

  const body = await parseBody(req, aiModelPatchSchema);
  if (body.error) return body.error;
  const data = body.data;

  const model = await db.aiModel.findUnique({ where: { id: params.id } });
  if (!model) return fail("Model not found", 404);

  if (data.modelId && data.modelId !== model.modelId) {
    const clash = await db.aiModel.findUnique({
      where: { modelId: data.modelId },
    });
    if (clash) return fail("A model with that model id already exists", 409);
  }

  const updated = await db.aiModel.update({
    where: { id: model.id },
    data: {
      label: data.label,
      modelId: data.modelId,
      inputPerMTok: data.inputPerMTok,
      outputPerMTok: data.outputPerMTok,
      enabled: data.enabled,
      notes: data.notes,
    },
  });
  return ok(updated);
}

/** Delete a registry model — blocked while it is one of the configured defaults. */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await guard("ADMIN");
  if (error) return error;

  const model = await db.aiModel.findUnique({ where: { id: params.id } });
  if (!model) return fail("Model not found", 404);

  const [pricingDefault, researchDefault] = await Promise.all([
    getSetting<string>("ai.defaultPricingModel", "claude-opus-4-8"),
    getSetting<string>("ai.defaultResearchModel", "claude-opus-4-8"),
  ]);
  if (
    model.modelId === pricingDefault ||
    model.modelId === researchDefault
  ) {
    return fail(
      "This model is set as a default in Defaults & Budget — pick a different default first",
      409
    );
  }

  await db.aiModel.delete({ where: { id: model.id } });
  return ok({ deleted: true });
}
