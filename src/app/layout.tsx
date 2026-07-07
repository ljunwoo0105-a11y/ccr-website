import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Space_Grotesk } from "next/font/google";
import { BUSINESS, SITE_URL } from "@/lib/config";
import "./globals.css";

// Pulse type system — Space Grotesk (display), Manrope (body),
// JetBrains Mono (the "instrument voice": labels, numbers, tables).
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BUSINESS.name} — Phone, Tablet & Computer Repairs Springfield Central`,
    template: `%s | ${BUSINESS.name}`,
  },
  description: `${BUSINESS.tagline}. Rated ${BUSINESS.defaultRating}★ from ${BUSINESS.defaultReviewCount}+ Google reviews. Express on-the-spot repairs at Orion Springfield Central.`,
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: BUSINESS.name,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-AU"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
