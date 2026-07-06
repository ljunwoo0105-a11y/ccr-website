import type { Metadata } from "next";
import { getSetting } from "@/lib/db";
import { getAggregateRating } from "@/lib/google-reviews";
import { ReviewsManager } from "@/components/admin/reviews-manager";

export const metadata: Metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const [aggregate, lastSyncAt] = await Promise.all([
    getAggregateRating(),
    getSetting<string | null>("google.lastSyncAt", null),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sync Google reviews, curate what shows on the public site, and record
          genuine feedback from other channels.
        </p>
      </header>

      <ReviewsManager aggregate={aggregate} lastSyncAt={lastSyncAt} />
    </div>
  );
}
