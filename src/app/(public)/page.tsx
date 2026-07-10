import type { Metadata } from "next";
import { BUSINESS } from "@/lib/config";
import { getAggregateRating, getPublicReviews } from "@/lib/google-reviews";
import JsonLd from "@/components/public/JsonLd";
import { localBusinessSchema, faqPageSchema } from "@/components/public/schema";
import { HOME_FAQS } from "@/components/public/faq-data";
import HeroBay from "@/components/sheet/HeroBay";
import SpecStrip from "@/components/sheet/SpecStrip";
import WorkOrders from "@/components/sheet/WorkOrders";
import CircuitSheet from "@/components/sheet/CircuitSheet";
import Procedure from "@/components/sheet/Procedure";
import QcLog from "@/components/sheet/QcLog";
import FieldNotes from "@/components/sheet/FieldNotes";
import Depot from "@/components/sheet/Depot";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Phone, Tablet & Computer Repairs Springfield Central",
  description: `Express phone, tablet, computer, drone and watch repairs at Orion Springfield Central. Rated ${BUSINESS.defaultRating}★ from ${BUSINESS.defaultReviewCount}+ Google reviews. Price Beat Guarantee, parts warranty up to 12 months. Get a free quote.`,
  alternates: { canonical: "/" },
};

/**
 * The Manifold home page — a field service manual read top to bottom:
 * SHEET 00 teardown bay → 01 work orders → 02 board-level → 03 procedure
 * → 04 QC log → 05 field notes → 06 the depot.
 */
export default async function HomePage() {
  const [{ rating, reviewCount }, reviews] = await Promise.all([
    getAggregateRating(),
    getPublicReviews(6),
  ]);

  return (
    <>
      <JsonLd data={localBusinessSchema(rating, reviewCount)} />
      <JsonLd data={faqPageSchema(HOME_FAQS)} />

      <HeroBay rating={rating} reviewCount={reviewCount} />
      <SpecStrip rating={rating} reviewCount={reviewCount} />
      <WorkOrders />
      <CircuitSheet />
      <Procedure />
      <QcLog reviews={reviews} rating={rating} reviewCount={reviewCount} />
      <FieldNotes />
      <Depot />
    </>
  );
}
