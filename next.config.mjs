/** @type {import('next').NextConfig} */
const scriptSrc = [
  "script-src",
  "'self'",
  "'unsafe-inline'",
  ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : []),
].join(" ");

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Baseline security headers for every route.
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Defence-in-depth XSS backstop. Next needs inline scripts/styles for
          // hydration; in development, the Next client also uses eval-backed
          // source maps, while production keeps eval disabled.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'none'",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "img-src 'self' data: blob: https:",
              "style-src 'self' 'unsafe-inline'",
              scriptSrc,
              "connect-src 'self'",
              "font-src 'self' data:",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          // HSTS is honoured only over HTTPS (ignored on http://localhost), so
          // it is safe to send globally and protects the staff/admin session.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Staff/admin areas must never be indexed or cached by shared caches.
        source: "/(staff|admin)/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
