// ---------------------------------------------------------------------------
// Verified business facts (researched June 2026). Do NOT reintroduce the
// fabricated placeholders from the old site ("(07) 3000-COOL",
// "info@coolcaserepair.com.au", "7am-9pm / 24-7"): they match no real source.
// ---------------------------------------------------------------------------

export const BUSINESS = {
  name: "CCR Cool Case Repair",
  legalName: "Cool Case Repair (CCR)",
  tagline:
    "Phone, Tablet, Computer, Drone and IT Solution Specialist in Springfield Central",
  phone: "0452 385 321",
  phoneHref: "tel:+61452385321",
  email: "coolcaserepair@gmail.com",
  address: {
    line1: "Orion Springfield Central, Kiosk K1",
    line2: "1 Main St",
    suburb: "Springfield Central",
    state: "QLD",
    postcode: "4300",
    country: "AU",
    landmark: "Near Foot Locker, inside the Big W mall",
  },
  geo: { lat: -27.677527, lng: 152.902035 },
  // Kiosk follows Orion Springfield Central centre hours.
  hours: [
    { days: "Mon – Wed", open: "9:00am", close: "5:30pm" },
    { days: "Thursday", open: "9:00am", close: "9:00pm" },
    { days: "Friday", open: "9:00am", close: "5:30pm" },
    { days: "Saturday", open: "9:00am", close: "5:00pm" },
    { days: "Sunday", open: "10:00am", close: "4:00pm" },
  ],
  googlePlaceId: process.env.GOOGLE_PLACE_ID ?? "ChIJT_o9vItLkWsRgHNb73gMvOA",
  googleReviewUrl:
    "https://search.google.com/local/writereview?placeid=ChIJT_o9vItLkWsRgHNb73gMvOA",
  googleMapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Cool+Case+Repair+Orion+Springfield+Central&query_place_id=ChIJT_o9vItLkWsRgHNb73gMvOA",
  socials: {
    facebook: "https://www.facebook.com/CCRSPRINGFIELD/",
    instagram: "https://www.instagram.com/ccrphonerepair/",
  },
  // Aggregate Google rating — refreshed by the Places sync into Settings;
  // these are the values verified at build time (June 2026).
  defaultRating: 4.9,
  defaultReviewCount: 1866,
} as const;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Device/repair catalog constants shared by quote wizard, intake and price list.
export const DEVICE_TYPES = [
  "Phone",
  "Tablet",
  "Computer",
  "Drone",
  "Watch",
  "Other",
] as const;

export const PART_QUALITIES = [
  "GENUINE",
  "OEM",
  "PREMIUM",
  "AFTERMARKET",
] as const;

export const QUALITY_LABELS: Record<(typeof PART_QUALITIES)[number], string> = {
  GENUINE: "Genuine (service pack)",
  OEM: "OEM grade",
  PREMIUM: "Premium aftermarket",
  AFTERMARKET: "Standard aftermarket",
};

/** Default warranty (days) per quality tier — editable per part in the price list. */
export const QUALITY_DEFAULT_WARRANTY: Record<string, number> = {
  GENUINE: 365,
  OEM: 180,
  PREMIUM: 180,
  AFTERMARKET: 90,
};

export const REFERRAL_SOURCES = [
  { value: "GOOGLE", label: "Google search / Maps" },
  { value: "WORD_OF_MOUTH", label: "Friend or family" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "WALK_IN", label: "Walked past the store" },
  { value: "REPEAT", label: "I'm a returning customer" },
  { value: "OTHER", label: "Other" },
] as const;
