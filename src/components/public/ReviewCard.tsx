import Stars from "@/components/public/Stars";
import { formatDate } from "@/lib/utils";

export interface PublicReview {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  reviewedAt: Date | null;
  source: string;
}

/**
 * Paper test-report card: mono initial tile, reviewer name, dated in the
 * instrument voice, gold stars, clamped verdict text and a GOOGLE source tag.
 */
export default function ReviewCard({ review }: { review: PublicReview }) {
  const initial = review.authorName.trim().charAt(0).toUpperCase() || "?";

  return (
    <article className="card-paper flex h-full flex-col p-6">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line font-mono text-sm text-ink-950"
        >
          {initial}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-950">
          {review.authorName}
        </span>
        {review.reviewedAt && (
          <span className="mono-label shrink-0 text-[0.6875rem] text-ink-500">
            {formatDate(review.reviewedAt)}
          </span>
        )}
      </div>

      <div className="mt-4">
        <Stars count={review.rating} />
        <span className="sr-only">{review.rating} out of 5 stars</span>
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-600 line-clamp-5">
        &ldquo;{review.text}&rdquo;
      </p>

      <footer className="mt-5 border-t border-line pt-4">
        <span className="mono-label inline-flex rounded-full border border-line px-2 py-0.5 text-[0.625rem] text-ink-500">
          Google
        </span>
      </footer>
    </article>
  );
}
