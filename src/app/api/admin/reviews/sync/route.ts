import { guard, ok } from "@/lib/api";
import { syncGoogleReviews } from "@/lib/google-reviews";

/**
 * Pull latest reviews + aggregate rating from Google Places.
 * Always returns ok(result) — result.ok=false with a friendly message covers
 * the missing-API-key and Places-error cases so the UI can surface it.
 */
export async function POST() {
  const { error } = await guard("ADMIN");
  if (error) return error;

  try {
    const result = await syncGoogleReviews();
    return ok(result);
  } catch {
    return ok({
      ok: false,
      message:
        "Sync failed — could not reach the Google Places API. Check the network and try again.",
    });
  }
}
