import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const rootDir = process.cwd();
const distDir = join(rootDir, "dist");
const assetsDir = join(distDir, "assets");
const serverDir = join(distDir, "server");
const appOutputDir = join(rootDir, ".next", "server", "app");
const nextStaticDir = join(rootDir, ".next", "static");
const publicDir = join(rootDir, "public");
const hostingConfig = join(rootDir, ".openai", "hosting.json");
const distHostingDir = join(distDir, ".openai");
const npm = "npm";

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env: process.env,
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function copyIfExists(from, to) {
  if (existsSync(from)) {
    await cp(from, to, { recursive: true });
  }
}

async function copyFileIfExists(from, to) {
  if (existsSync(from)) {
    await cp(from, to);
  }
}

const pages = [
  "index",
  "privacy",
  "quote",
  "reviews",
  "services",
  "terms",
  "warranty",
  "_not-found",
];

await rm(distDir, { recursive: true, force: true });
run(npm, ["run", "build:next"]);

await mkdir(assetsDir, { recursive: true });
await mkdir(serverDir, { recursive: true });
await mkdir(distHostingDir, { recursive: true });

await copyIfExists(publicDir, assetsDir);
await copyIfExists(nextStaticDir, join(assetsDir, "_next", "static"));

for (const page of pages) {
  await copyFileIfExists(
    join(appOutputDir, `${page}.html`),
    join(assetsDir, `${page}.html`),
  );
  await copyFileIfExists(
    join(appOutputDir, `${page}.rsc`),
    join(assetsDir, `${page}.rsc`),
  );
}

await copyFileIfExists(join(appOutputDir, "icon.svg.body"), join(assetsDir, "icon.svg"));
await copyFileIfExists(join(appOutputDir, "robots.txt.body"), join(assetsDir, "robots.txt"));
await copyFileIfExists(join(appOutputDir, "sitemap.xml.body"), join(assetsDir, "sitemap.xml"));
await cp(hostingConfig, join(distHostingDir, "hosting.json"));

await writeFile(
  join(serverDir, "index.js"),
  `const HTML_ROUTES = new Map([
  ["/", "/index.html"],
  ["/privacy", "/privacy.html"],
  ["/quote", "/quote.html"],
  ["/reviews", "/reviews.html"],
  ["/services", "/services.html"],
  ["/terms", "/terms.html"],
  ["/warranty", "/warranty.html"],
]);

const RSC_ROUTES = new Map([
  ["/", "/index.rsc"],
  ["/privacy", "/privacy.rsc"],
  ["/quote", "/quote.rsc"],
  ["/reviews", "/reviews.rsc"],
  ["/services", "/services.rsc"],
  ["/terms", "/terms.rsc"],
  ["/warranty", "/warranty.rsc"],
]);

const SECURITY_HEADERS = {
  "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
  "content-security-policy": "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; font-src 'self' data:; upgrade-insecure-requests",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

function normalizedPath(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function contentTypeFor(pathname) {
  if (pathname.endsWith(".html")) return "text/html; charset=utf-8";
  if (pathname.endsWith(".rsc")) return "text/x-component; charset=utf-8";
  if (pathname.endsWith(".svg")) return "image/svg+xml; charset=utf-8";
  if (pathname.endsWith(".txt")) return "text/plain; charset=utf-8";
  if (pathname.endsWith(".xml")) return "application/xml; charset=utf-8";
  return null;
}

function withHeaders(response, pathname) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }

  const contentType = contentTypeFor(pathname);
  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (pathname.includes("/_next/static/")) {
    headers.set("cache-control", "public, max-age=31536000, immutable");
  } else if (pathname.endsWith(".html") || pathname.endsWith(".rsc")) {
    headers.set("cache-control", "s-maxage=3600, stale-while-revalidate=2592000");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function asset(env, request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  const response = await env.ASSETS.fetch(new Request(url, request));
  return withHeaders(response, pathname);
}

function unavailable(message, asJson = false) {
  if (asJson) {
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 503,
      headers: {
        "content-type": "application/json; charset=utf-8",
        ...SECURITY_HEADERS,
      },
    });
  }

  return new Response("<!doctype html><title>Temporarily unavailable</title><main style=\\"font-family:system-ui,sans-serif;padding:3rem;max-width:42rem\\"><h1>Temporarily unavailable</h1><p>" + message + "</p><p><a href=\\"/\\">Return to CCR Cool Case Repair</a></p></main>", {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...SECURITY_HEADERS,
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = normalizedPath(url.pathname);

    if (pathname.startsWith("/api/")) {
      return unavailable("This form endpoint is not available on the static Sites deployment yet.", true);
    }

    if (pathname.startsWith("/staff") || pathname.startsWith("/admin")) {
      return unavailable("The staff/admin portal needs a database-backed runtime and is not available on this static Sites deployment yet.");
    }

    if (pathname.startsWith("/_next/") || /\.[a-z0-9]+$/i.test(pathname)) {
      const response = await env.ASSETS.fetch(request);
      if (response.status !== 404) {
        return withHeaders(response, pathname);
      }
    }

    const route = request.headers.get("rsc") === "1" || url.searchParams.has("_rsc")
      ? RSC_ROUTES.get(pathname)
      : HTML_ROUTES.get(pathname);

    if (route) {
      return asset(env, request, route);
    }

    const notFound = await asset(env, request, "/_not-found.html");
    return new Response(notFound.body, {
      status: 404,
      headers: notFound.headers,
    });
  },
};
`,
);
