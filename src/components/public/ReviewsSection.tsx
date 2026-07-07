import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BUSINESS } from "@/lib/config";
import ReviewCard, { type PublicReview } from "@/components/public/ReviewCard";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import StarRow from "@/components/motion/StarRow";

/**
 * Verified results — dark act. A giant tabular rating numeral with gold
 * stars, then a grid of synced Google review "test reports". Only real
 * synced records are shown; the empty state stays honest.
 */
export default function ReviewsSection({
  reviews,
  rating,
  reviewCount,
}: {
  reviews: PublicReview[];
  rating: number;
  reviewCount: number;
}) {
  return (
    <section className="bg-ink-950 py-24" aria-labelledby="reviews-heading">
      <div className="site-container-wide">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="eyebrow text-gold-500">03 — VERIFIED RESULTS</span>
            <div className="h-px flex-1 bg-ink-700" aria-hidden="true" />
          </div>

          <h2 id="reviews-heading" className="sr-only">
            Rated {rating.toFixed(1)} by local customers on Google
          </h2>

          <div className="mt-8 flex flex-wrap items-end gap-x-6 gap-y-4">
            <p className="type-display tnum text-[clamp(3.5rem,6vw,5.5rem)] text-ink-50">
              {rating.toFixed(1)}
            </p>
            <div className="flex flex-col gap-2 pb-2 sm:pb-4">
              <StarRow rating={rating} size={18} />
              <p className="mono-label text-ink-400">
                From {reviewCount.toLocaleString("en-AU")}+ Google reviews
              </p>
            </div>
          </div>
        </Reveal>

        {reviews.length > 0 ? (
          <RevealGroup className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, index) => (
              <RevealItem key={review.id} index={index} className="h-full">
                <ReviewCard review={review} />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <Reveal className="mx-auto mt-12 max-w-2xl">
            <div className="card-dark p-8 text-center">
              <p className="mono-label text-[0.6875rem] text-ink-400">
                No synced reviews yet
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-300">
                Live Google review snippets have not been synced into the
                backend yet. We are not showing mock reviews here.
              </p>
              <a
                href={BUSINESS.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-gold mt-4 inline-flex items-center gap-1.5 text-sm"
              >
                Read the real reviews on Google
                <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>
          </Reveal>
        )}

        <Reveal className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Link href="/reviews" className="btn-ghost-dark btn-sm">
            Read all synced reviews
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
          <a
            href={BUSINESS.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-gold inline-flex items-center gap-1.5 text-sm"
          >
            Leave us a review
            <ArrowRight size={14} aria-hidden="true" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
