import type { Metadata } from "next";
import { BUSINESS } from "@/lib/config";
import { getAggregateRating, getPublicReviews } from "@/lib/google-reviews";
import Hero from "@/components/public/Hero";
import StatsBand from "@/components/public/StatsBand";
import ServicesGrid from "@/components/public/ServicesGrid";
import WhyChooseUs from "@/components/public/WhyChooseUs";
import ReviewsSection from "@/components/public/ReviewsSection";
import FaqSection from "@/components/public/FaqSection";
import ContactSection from "@/components/public/ContactSection";
import CtaBanner from "@/components/public/CtaBanner";
import JsonLd from "@/components/public/JsonLd";
import { localBusinessSchema, faqPageSchema } from "@/components/public/schema";
import { HOME_FAQS } from "@/components/public/faq-data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Phone, Tablet & Computer Repairs Springfield Central",
  description: `Express phone, tablet, computer, drone and watch repairs at Orion Springfield Central. Rated ${BUSINESS.defaultRating}★ from ${BUSINESS.defaultReviewCount}+ Google reviews. Price Beat Guarantee, parts warranty up to 12 months. Get a free quote.`,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [{ rating, reviewCount }, reviews] = await Promise.all([
    getAggregateRating(),
    getPublicReviews(6),
  ]);

  return (
    <>
      <JsonLd data={localBusinessSchema(rating, reviewCount)} />
      <JsonLd data={faqPageSchema(HOME_FAQS)} />

      <Hero rating={rating} reviewCount={reviewCount} />
      <StatsBand rating={rating} reviewCount={reviewCount} />
      <ServicesGrid />
      <WhyChooseUs rating={rating} reviewCount={reviewCount} />
      <ReviewsSection
        reviews={reviews}
        rating={rating}
        reviewCount={reviewCount}
      />
      <FaqSection />
      <ContactSection />
      <CtaBanner />
    </>
  );
}
