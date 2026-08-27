import "server-only";
import { BUSINESS } from "@/lib/config";
import { shouldSyncGoogleReviews } from "@/lib/google-review-sync-policy";

/**
 * Google reviews sync via the Places API (New).
 *
 * Pulls the listing's aggregate rating/count plus the reviews Google exposes
 * (Places returns up to 5 of the most relevant), and upserts them into the
 * Review table keyed by Google's review resource name so re-syncs never
 * duplicate. The PUBLIC site then shows only `visible = true AND rating = 5`
 * — that filter lives in the query layer below, not in the client.
 */

interface PlacesReview {
  name: string; // resource name — stable id
  rating: number;
  text?: { text: string };
  originalText?: { text: string };
  authorAttribution?: { displayName?: string };
  publishTime?: string;
}

interface PlaceDetails {
  rating?: number;
  userRatingCount?: number;
  reviews?: PlacesReview[];
}

type DatabaseModule = typeof import("@/lib/db");
interface PublicReview {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  reviewedAt: Date | null;
  source: string;
}
const GOOGLE_REQUEST_TIMEOUT_MS = 10_000;

async function getDatabase(): Promise<DatabaseModule | null> {
  if (!process.env.DATABASE_URL?.trim()) {
    return null;
  }

  try {
    return await import("@/lib/db");
  } catch {
    return null;
  }
}

// After a failed read (e.g. the database is down or unreachable), public
// pages skip the database entirely for a short window instead of paying the
// full connection timeout on every request.
const DB_RETRY_AFTER_MS = 30_000;
let dbUnavailableUntil = 0;

async function withPublicReviewFallback<T>(
  read: (database: DatabaseModule) => Promise<T>,
  fallback: T
): Promise<T> {
  if (Date.now() < dbUnavailableUntil) {
    return fallback;
  }

  const database = await getDatabase();
  if (!database) {
    return fallback;
  }

  try {
    const result = await read(database);
    dbUnavailableUntil = 0;
    return result;
  } catch {
    dbUnavailableUntil = Date.now() + DB_RETRY_AFTER_MS;
    return fallback;
  }
}

export interface ReviewSyncResult {
  ok: boolean;
  message: string;
  rating?: number;
  reviewCount?: number;
  reviewsUpserted?: number;
}

export async function syncGoogleReviews(): Promise<ReviewSyncResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  const placeId = BUSINESS.googlePlaceId;
  if (!apiKey) {
    return {
      ok: false,
      message:
        "GOOGLE_PLACES_API_KEY is not configured. Add it to .env (enable 'Places API (New)') to sync live Google reviews.",
    };
  }

  let res: Response;
  try {
    res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "rating,userRatingCount,reviews",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(GOOGLE_REQUEST_TIMEOUT_MS),
      }
    );
  } catch {
    return {
      ok: false,
      message: "Google Places API could not be reached within 10 seconds.",
    };
  }
  if (!res.ok) {
    return {
      ok: false,
      message: `Google Places API returned ${res.status}. Check the API key and that the place id is correct.`,
    };
  }

  const place = (await res.json()) as PlaceDetails;
  const database = await getDatabase();
  if (!database) {
    return {
      ok: false,
      message: "DATABASE_URL is not configured. Add it before syncing reviews.",
    };
  }

  const { db, setSetting } = database;
  let upserted = 0;

  for (const review of place.reviews ?? []) {
    const text =
      review.text?.text ?? review.originalText?.text ?? "";
    if (!text.trim()) continue;
    await db.review.upsert({
      where: { externalId: review.name },
      update: {
        rating: review.rating,
        text,
        authorName: review.authorAttribution?.displayName ?? "Google user",
        reviewedAt: review.publishTime ? new Date(review.publishTime) : null,
      },
      create: {
        source: "GOOGLE",
        externalId: review.name,
        rating: review.rating,
        text,
        authorName: review.authorAttribution?.displayName ?? "Google user",
        reviewedAt: review.publishTime ? new Date(review.publishTime) : null,
        visible: true,
      },
    });
    upserted += 1;
  }

  if (typeof place.rating === "number") {
    await setSetting("google.rating", place.rating);
  }
  if (typeof place.userRatingCount === "number") {
    await setSetting("google.reviewCount", place.userRatingCount);
  }
  await setSetting("google.lastSyncAt", new Date().toISOString());

  return {
    ok: true,
    message: `Synced ${upserted} reviews from Google.`,
    rating: place.rating,
    reviewCount: place.userRatingCount,
    reviewsUpserted: upserted,
  };
}

/**
 * Safe public-page sync. It only calls Google when credentials exist and the
 * last successful sync is stale, so normal page traffic does not burn quota.
 */
export async function syncGoogleReviewsIfStale(): Promise<ReviewSyncResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      message:
        "GOOGLE_PLACES_API_KEY is not configured. Add it to .env to sync live Google reviews.",
    };
  }

  const lastSyncAt = await withPublicReviewFallback(
    ({ getSetting }) => getSetting<string | null>("google.lastSyncAt", null),
    null
  );
  if (
    !shouldSyncGoogleReviews({
      hasApiKey: true,
      lastSyncAt,
    })
  ) {
    return {
      ok: true,
      message: "Google reviews are already fresh.",
    };
  }

  return syncGoogleReviews();
}

/** Aggregate rating shown publicly (live values once synced, else verified defaults). */
export async function getAggregateRating(): Promise<{
  rating: number;
  reviewCount: number;
}> {
  const [rating, reviewCount] = await Promise.all([
    withPublicReviewFallback(
      ({ getSetting }) =>
        getSetting<number>("google.rating", BUSINESS.defaultRating),
      BUSINESS.defaultRating
    ),
    withPublicReviewFallback(
      ({ getSetting }) =>
        getSetting<number>(
          "google.reviewCount",
          BUSINESS.defaultReviewCount
        ),
      BUSINESS.defaultReviewCount
    ),
  ]);

  return {
    rating,
    reviewCount,
  };
}

/**
 * THE public review feed. Five-star only, by business policy — this is the
 * single query the public site is allowed to read reviews through.
 */
export async function getPublicReviews(limit = 12) {
  return withPublicReviewFallback<PublicReview[]>(
    ({ db }) =>
      db.review.findMany({
        where: {
          visible: true,
          rating: 5,
          source: "GOOGLE",
          externalId: { not: null },
          NOT: { externalId: { startsWith: "seed-" } },
        },
        orderBy: [{ reviewedAt: "desc" }, { createdAt: "desc" }],
        take: limit,
        select: {
          id: true,
          authorName: true,
          rating: true,
          text: true,
          reviewedAt: true,
          source: true,
        },
      }),
    []
  );
}
