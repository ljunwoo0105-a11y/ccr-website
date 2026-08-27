import "server-only";
import process from "node:process";
import { neonConfig } from "@neondatabase/serverless";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { PrismaClient as WorkerPrismaClient } from "@prisma/client/wasm";

// Let ordinary queries use Neon's HTTP transport. Interactive Prisma
// transactions automatically use a short-lived WebSocket connection instead.
neonConfig.poolQueryViaFetch = true;

const workerEnvSymbol = Symbol.for("ccr.worker.env");

function isNeonConnectionString(value: string): boolean {
  try {
    return new URL(value).hostname.endsWith(".neon.tech");
  } catch {
    return false;
  }
}

function getRuntimeConnectionString(): string | undefined {
  // The Sites Worker entry records its runtime bindings before OpenNext enters
  // Next's request context. This survives request-context boundaries created by
  // Next/Prisma while keeping the credential only in Worker memory.
  const runtimeEnv = (globalThis as unknown as Record<PropertyKey, unknown>)[
    workerEnvSymbol
  ];
  const workerValue =
    runtimeEnv && typeof runtimeEnv === "object"
      ? (runtimeEnv as Record<string, unknown>).DATABASE_URL
      : undefined;

  // OpenNext attaches Worker bindings to the Cloudflare request context. That
  // context is not available when this module is first evaluated, so reading
  // process.env only at module scope can accidentally select Prisma's native
  // (and Worker-incompatible) query engine.
  let contextValue: unknown;
  try {
    const { env } = getCloudflareContext();
    contextValue = (env as Record<string, unknown>).DATABASE_URL;
  } catch {
    // next build, scripts, tests, and the Node deployment do not have a
    // Cloudflare request context. They use the ordinary process environment.
  }

  const processValue = process.env.DATABASE_URL;
  const selected = [workerValue, contextValue, processValue].find(
    (value): value is string => typeof value === "string" && Boolean(value.trim()),
  );

  return selected?.trim();
}

function createPrismaClient(connectionString?: string): PrismaClient {
  // Keep local PostgreSQL and the old Railway deployment usable during the
  // zero-downtime cutover. Cloudflare uses the Neon serverless adapter.
  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }
  if (!isNeonConnectionString(connectionString)) {
    return new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    });
  }

  const adapter = new PrismaNeon({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 1_000,
  });
  if (
    (globalThis as unknown as Record<PropertyKey, unknown>)[workerEnvSymbol]
  ) {
    return new WorkerPrismaClient({ adapter }) as unknown as PrismaClient;
  }
  return new PrismaClient({ adapter });
}

// Reuse a native client only in Node development. Cloudflare clients must be
// created after request bindings exist and must not retain I/O across requests.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
function getPrismaClient(): PrismaClient {
  const connectionString = getRuntimeConnectionString();
  if (connectionString && isNeonConnectionString(connectionString)) {
    return createPrismaClient(connectionString);
  }

  const client = globalForPrisma.prisma ?? createPrismaClient(connectionString);
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

// Existing repositories can keep using `db.model.method(...)`. The proxy delays
// client creation until the operation runs inside a request, and binds Prisma's
// client methods (notably $transaction) to that operation's client.
export const db = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client) as unknown;
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/** Read a JSON setting; returns fallback when missing or unparsable. */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.setting.findUnique({ where: { key } });
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

/** Upsert a JSON setting. */
export async function setSetting(key: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  await db.setting.upsert({
    where: { key },
    update: { value: json },
    create: { key, value: json },
  });
}
