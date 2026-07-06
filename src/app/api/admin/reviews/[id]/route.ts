import { z } from "zod";
import { db } from "@/lib/db";
import { fail, guard, ok, parseBody } from "@/lib/api";

const reviewPatchSchema = z.object({
  visible: z.boolean(),
});

/** Show/hide a review on the public site. */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await guard("ADMIN");
  if (error) return error;

  const body = await parseBody(req, reviewPatchSchema);
  if (body.error) return body.error;

  const review = await db.review.findUnique({ where: { id: params.id } });
  if (!review) return fail("Review not found", 404);

  const updated = await db.review.update({
    where: { id: review.id },
    data: { visible: body.data.visible },
  });
  return ok(updated);
}

/** Delete a manual review. Google reviews can only be hidden, not deleted. */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await guard("ADMIN");
  if (error) return error;

  const review = await db.review.findUnique({ where: { id: params.id } });
  if (!review) return fail("Review not found", 404);

  if (review.source !== "MANUAL") {
    return fail(
      "Google reviews can't be deleted — use the visible toggle to hide them instead",
      409
    );
  }

  await db.review.delete({ where: { id: review.id } });
  return ok({ deleted: true });
}
