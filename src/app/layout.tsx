import type { Metadata } from "next";
import { Archivo, Archivo_Black, IBM_Plex_Mono } from "next/font/google";
import { BUSINESS, SITE_URL } from "@/lib/config";
import "./globals.css";

// Manifold type system — Archivo Black (display: heavy industrial stencil
// voice), Archivo (body), IBM Plex Mono (the drafting voice: sheet numbers,
// dimensions, part indices — never paragraphs).
const display = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const sans = Archivo({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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

// Resolves the theme before first paint — stored choice, else dark.
// Runs as the first thing in <body>; must stay dependency-free and tiny.
// Only the storage read may throw (cookie-blocking modes); the dark fallback
// and DOM writes must still run, so they live outside the try.
const THEME_BOOT = `(function(){var t=null;try{t=localStorage.getItem("ccr-theme-v2")}catch(e){}if(t!=="dark"&&t!=="light"){t="dark"}var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-AU"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans">
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        {children}
      </body>
    </html>
  );
}
