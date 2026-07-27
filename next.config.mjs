import { fileURLToPath } from "node:url";

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
  output: "standalone",
  // A stray package-lock.json in the user profile directory otherwise makes
  // Next infer C:\Users\<name> as the workspace root.
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  // The hero/board pull ~16 named exports from the @react-three/drei barrel.
  // Without this, dev (which doesn't tree-shake) compiles the whole 1.6 MB
  // package into the "/" chunk on every compile. lucide-react is already on
  // Next's built-in optimize list, so only drei needs adding here.
  experimental: {
    optimizePackageImports: ["@react-three/drei"],
  },
  webpack(config) {
    config.output.hashSalt = "ccr-dark-default-v3";
    return config;
  },
  async redirects() {
    // The staff portal folded into the admin console. Old bookmarks and any
    // link still pointing at /staff/* land on the equivalent console page
    // instead of a 404. /staff/login is untouched — it is still the way in.
    return [
      { source: "/staff", destination: "/admin", permanent: false },
      // The Workshop dashboard merged into the console home.
      { source: "/admin/workshop", destination: "/admin", permanent: false },
      { source: "/staff/price-list", destination: "/admin/catalog", permanent: false },
      { source: "/staff/intake/:path*", destination: "/admin/intake/:path*", permanent: false },
      { source: "/staff/inventory/:path*", destination: "/admin/inventory/:path*", permanent: false },
      { source: "/staff/leads/:path*", destination: "/admin/leads/:path*", permanent: false },
    ];
  },
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
