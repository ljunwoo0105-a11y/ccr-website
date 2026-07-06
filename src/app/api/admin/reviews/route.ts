import { db } from "@/lib/db";
import { guard, ok, parseBody } from "@/lib/api";
import { manualReviewSchema } from "@/lib/validation";

/** All reviews (Google + manual), newest first — admin sees everything. */
export async function GET() {
  const { error } = await guard("ADMIN");
  if (error) return error;

  const reviews = await db.review.findMany({
    orderBy: { createdAt: "desc" },
  });
  return ok(reviews);
}

/**
 * Add a manual review (genuine feedback from Facebook / in-store only —
 * fake reviews breach Australian Consumer Law).
 */
export async function POST(req: Request) {
  const { error } = await guard("ADMIN");
  if (error) return error;

  const body = await parseBody(req, manualReviewSchema);
  if (body.error) return body.error;
  const data = body.data;

  const review = await db.review.create({
    data: {
      source: "MANUAL",
      authorName: data.authorName,
      rating: data.rating,
      text: data.text,
      reviewedAt: data.reviewedAt ? new Date(data.reviewedAt) : null,
      visible: data.visible ?? true,
    },
  });
  return ok(review, { status: 201 });
}
