import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString || !new URL(connectionString).hostname.endsWith(".neon.tech")) {
  throw new Error("DATABASE_URL must point to Neon.");
}

neonConfig.poolQueryViaFetch = true;
const adapter = new PrismaNeon({
  connectionString,
  max: 2,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 1_000,
});
const db = new PrismaClient({ adapter });

try {
  const [users, parts, reviews] = await Promise.all([
    db.user.count(),
    db.part.count(),
    db.review.count(),
  ]);
  const settingsInTransaction = await db.$transaction((transaction) =>
    transaction.setting.count(),
  );

  console.info(
    JSON.stringify({ users, parts, reviews, settingsInTransaction }),
  );
} finally {
  await db.$disconnect();
}
