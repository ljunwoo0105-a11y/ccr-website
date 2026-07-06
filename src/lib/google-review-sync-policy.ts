export interface GoogleReviewSyncPolicyInput {
  hasApiKey: boolean;
  lastSyncAt: string | null;
  now?: Date;
  maxAgeMs?: number;
}

export const DEFAULT_GOOGLE_REVIEW_SYNC_MAX_AGE_MS = 60 * 60 * 1000;

export function shouldSyncGoogleReviews({
  hasApiKey,
  lastSyncAt,
  now = new Date(),
  maxAgeMs = DEFAULT_GOOGLE_REVIEW_SYNC_MAX_AGE_MS,
}: GoogleReviewSyncPolicyInput) {
  if (!hasApiKey) return false;
  if (!lastSyncAt) return true;

  const lastSyncTime = Date.parse(lastSyncAt);
  if (Number.isNaN(lastSyncTime)) return true;

  return now.getTime() - lastSyncTime >= maxAgeMs;
}
