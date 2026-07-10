import { Star } from "lucide-react";
import { BUSINESS } from "@/lib/config";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import Sheet from "./Sheet";

interface ReviewRow {
  id: string;
  authorName: string;
  rating: number;
  text: string | null;
  reviewedAt: Date | null;
}

/**
 * SHEET 04 — customer reviews presented as quality-control log entries,
 * each row stamped PASS. Five-star Google feed only (business policy).
 */
export default function QcLog({
  reviews,
  rating,
  reviewCount,
}: {
  reviews: ReviewRow[];
  rating: number;
  reviewCount: number;
}) {
  return (
    <Sheet no="04" tone="recessed" footerNote="FEED · GOOGLE BUSINESS PROFILE — UNEDITED CUSTOMER ENTRIES">
      <div className="py-10 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="mnl-display text-4xl text-carbon-950 sm:text-5xl">
            QC log<span className="text-signal-500">.</span>
          </h2>
          <a
            href={BUSINESS.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-baseline gap-2"
          >
            <span className="flex items-center gap-0.5" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-star text-star" />
              ))}
            </span>
            <span className="mnl-dim mnl-num text-carbon-950">
              {rating.toFixed(1)} / 5.0
            </span>
            <span className="mnl-dim text-carbon-500 underline-offset-4 group-hover:underline">
              {reviewCount.toLocaleString("en-AU")}+ ENTRIES →
            </span>
          </a>
        </div>

        {reviews.length === 0 ? (
          <div className="mnl-plate-flat mt-10 p-6">
            <p className="font-mono text-xs leading-relaxed text-carbon-500">
              LOG SYNCING… Read {reviewCount.toLocaleString("en-AU")}+ verified
              entries on our{" "}
              <a
                href={BUSINESS.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mnl-link text-carbon-950"
              >
                Google profile
              </a>
              .
            </p>
          </div>
        ) : (
          <RevealGroup as="ul" className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3" stagger={0.06}>
            {reviews.slice(0, 6).map((review, i) => (
              <RevealItem key={review.id} as="li" index={i} y={20}>
                <article className="mnl-plate-flat flex h-full flex-col bg-bone-50 p-5">
                  <header className="flex items-center justify-between border-b border-carbon-150 pb-3">
                    <span className="mnl-dim mnl-num text-carbon-500">
                      ENTRY {String(i + 1).padStart(3, "0")}
                    </span>
                    <span className="mnl-dim border border-signal-500 px-2 py-0.5 text-signal-600">
                      PASS ✓
                    </span>
                  </header>
                  <div className="mt-3 flex items-center gap-0.5" role="img" aria-label={`${review.rating} out of 5 stars`}>
                    {Array.from({ length: review.rating }).map((_, s) => (
                      <Star key={s} className="h-3 w-3 fill-star text-star" aria-hidden="true" />
                    ))}
                  </div>
                  {review.text ? (
                    <p className="mt-3 flex-1 text-xs leading-relaxed text-carbon-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:5] overflow-hidden">
                      “{review.text}”
                    </p>
                  ) : null}
                  <footer className="mt-4 flex items-baseline justify-between gap-3">
                    <span className="mnl-dim text-carbon-950">
                      {review.authorName}
                    </span>
                    {review.reviewedAt ? (
                      <time
                        className="mnl-dim mnl-num text-carbon-500"
                        dateTime={review.reviewedAt.toISOString()}
                      >
                        {review.reviewedAt.toLocaleDateString("en-AU", {
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                    ) : null}
                  </footer>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-carbon-150 pt-5">
          <p className="mnl-dim text-carbon-500">
            HAD A REPAIR WITH US? STAMP THE LOG —
          </p>
          <a
            href={BUSINESS.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mnl-btn-ghost mnl-btn-sm"
          >
            Leave a Google review
          </a>
        </div>
      </div>
    </Sheet>
  );
}
