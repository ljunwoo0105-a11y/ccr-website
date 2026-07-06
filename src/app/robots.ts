import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

/**
 * Staff/admin/API surfaces are off-limits to every crawler. AI crawlers are
 * explicitly ALLOWED on the public pages for generative-engine visibility
 * (so answers about "phone repair Springfield" can cite CCR).
 */
const PRIVATE_PATHS = ["/staff", "/admin", "/api"];

const AI_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
