import { BUSINESS, SITE_URL } from "@/lib/config";

/**
 * JSON-LD builders for the public marketing site.
 * Business facts come exclusively from BUSINESS in @/lib/config.
 * No part prices are ever included in structured data (product rule #1).
 */

const DAY_NAMES: readonly string[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** "Mon – Wed" → ["Monday","Tuesday","Wednesday"]; "Thursday" → ["Thursday"]. */
function expandDays(label: string): string[] {
  const match = (token: string): string | undefined => {
    const t = token.trim().toLowerCase().slice(0, 3);
    return DAY_NAMES.find((d) => d.toLowerCase().startsWith(t));
  };
  const parts = label
    .split(/[–—-]/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 2) {
    const start = DAY_NAMES.indexOf(match(parts[0]) ?? "");
    const end = DAY_NAMES.indexOf(match(parts[1]) ?? "");
    if (start >= 0 && end >= start) return DAY_NAMES.slice(start, end + 1);
  }
  const single = match(label);
  return single ? [single] : [];
}

/** "9:00am" → "09:00", "5:30pm" → "17:30" (schema.org wants 24h). */
function to24h(time: string): string {
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(time.trim());
  if (!m) return time;
  let hour = parseInt(m[1], 10);
  const meridiem = m[3].toLowerCase();
  if (meridiem === "pm" && hour !== 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${m[2]}`;
}

function openingHoursSpecification(): Record<string, unknown>[] {
  return BUSINESS.hours.map((h) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: expandDays(h.days),
    opens: to24h(h.open),
    closes: to24h(h.close),
  }));
}

function postalAddress(): Record<string, unknown> {
  return {
    "@type": "PostalAddress",
    streetAddress: `${BUSINESS.address.line1}, ${BUSINESS.address.line2}`,
    addressLocality: BUSINESS.address.suburb,
    addressRegion: BUSINESS.address.state,
    postalCode: BUSINESS.address.postcode,
    addressCountry: BUSINESS.address.country,
  };
}

/** Core LocalBusiness / ElectronicsStore entity with live aggregate rating. */
export function localBusinessSchema(
  rating: number,
  reviewCount: number
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    "@id": `${SITE_URL}/#business`,
    name: BUSINESS.name,
    alternateName: BUSINESS.legalName,
    description: BUSINESS.tagline,
    url: SITE_URL,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    address: postalAddress(),
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.lat,
      longitude: BUSINESS.geo.lng,
    },
    hasMap: BUSINESS.googleMapsUrl,
    openingHoursSpecification: openingHoursSpecification(),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: rating,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    sameAs: [BUSINESS.socials.facebook, BUSINESS.socials.instagram],
    priceRange: "$$",
    currenciesAccepted: "AUD",
    areaServed: [
      "Springfield Central",
      "Springfield Lakes",
      "Greater Springfield",
      "Ipswich",
      "Brisbane",
    ],
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqPageSchema(faqs: FaqItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/** ItemList of Service entities for the /services page. */
export function servicesSchema(
  services: { name: string; description: string; anchor: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.name,
        description: s.description,
        url: `${SITE_URL}/services#${s.anchor}`,
        serviceType: s.name,
        areaServed: "Greater Springfield QLD",
        provider: { "@id": `${SITE_URL}/#business` },
      },
    })),
  };
}

export interface ReviewForSchema {
  authorName: string;
  rating: number;
  text: string;
  reviewedAt: Date | null;
}

/** LocalBusiness with AggregateRating + Review list for the /reviews page. */
export function reviewsPageSchema(
  rating: number,
  reviewCount: number,
  reviews: ReviewForSchema[]
): Record<string, unknown> {
  return {
    ...localBusinessSchema(rating, reviewCount),
    review: reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.authorName },
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: r.text,
      ...(r.reviewedAt
        ? { datePublished: r.reviewedAt.toISOString().slice(0, 10) }
        : {}),
    })),
  };
}
