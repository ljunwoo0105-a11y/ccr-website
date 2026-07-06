import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { BUSINESS } from "@/lib/config";
import { getAggregateRating, getPublicReviews } from "@/lib/google-reviews";
import ReviewCard from "@/components/public/ReviewCard";
import CtaBanner from "@/components/public/CtaBanner";
import JsonLd from "@/components/public/JsonLd";
import { reviewsPageSchema } from "@/components/public/schema";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import StarRow from "@/components/motion/StarRow";
import PageMasthead from "@/components/public/pages/PageMasthead";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Customer Reviews — Rated on Google",
  description: `Read five-star Google reviews for ${BUSINESS.name} at Orion Springfield Central. Rated ${BUSINESS.defaultRating}★ from ${BUSINESS.defaultReviewCount}+ reviews for phone, tablet and computer repairs.`,
  alternates: { canonical: "/reviews" },
};

export default async function ReviewsPage() {
  const [{ rating, reviewCount }, reviews] = await Promise.all([
    getAggregateRating(),
    getPublicReviews(50),
  ]);

  return (
    <>
      <JsonLd
        data={reviewsPageSchema(
          rating,
          reviewCount,
          reviews.map((r) => ({
            authorName: r.authorName,
            rating: r.rating,
            text: r.text,
            reviewedAt: r.reviewedAt,
          }))
        )}
      />

      {/* Spec-sheet masthead with the live aggregate rating */}
      <PageMasthead
        breadcrumb="CCR / REVIEWS"
        title={
          <>
            <span className="tnum">
              {reviewCount.toLocaleString("en-AU")}+
            </span>{" "}
            verified opinions.
          </>
        }
        lead="Every review below is a public Google review left by a customer after their repair at Orion Springfield Central."
      >
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          <p className="type-display tnum text-5xl text-gold-500">
            {rating.toFixed(1)}
          </p>
          <div>
            <StarRow rating={rating} size={20} />
            <p className="mt-1.5 text-sm text-ink-400">
              from {reviewCount.toLocaleString("en-AU")}+ Google reviews
            </p>
          </div>
        </div>
        <div className="mt-8">
          <a
            href={BUSINESS.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold"
          >
            Write a Google review
          </a>
        </div>
      </PageMasthead>

      {/* Review grid on paper */}
      <section className="bg-paper py-16 sm:py-20" aria-label="Customer reviews">
        <div className="site-container-wide">
          {reviews.length > 0 ? (
            <RevealGroup className="columns-1 gap-5 sm:columns-2 lg:columns-3">
              {reviews.map((review, i) => (
                <RevealItem
                  key={review.id}
                  index={i}
                  className="mb-5 break-inside-avoid"
                >
                  <ReviewCard review={review} />
                </RevealItem>
              ))}
            </RevealGroup>
          ) : (
            <div className="card-paper mx-auto max-w-xl p-6 text-center">
              <p className="text-sm leading-relaxed text-ink-600">
                Our latest reviews live on Google — read them on our listing,
                or leave one of your own after your repair.
              </p>
              <div className="mt-4 flex justify-center">
                <a
                  href={BUSINESS.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-paper inline-flex items-center gap-1.5 text-sm"
                >
                  See our Google listing
                  <ArrowRight size={14} aria-hidden="true" />
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      <CtaBanner
        heading="Join thousands of happy customers"
        body="Get a free emailed estimate for your repair — confirmed with a free in-store inspection at Orion Springfield Central."
      />
    </>
  );
}
