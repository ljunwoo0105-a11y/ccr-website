#!/usr/bin/env bash
# CCR website — Cloud Agent install (idempotent repository bootstrap).
# Runs after checkout. Prepares PostgreSQL, Node deps, Prisma client, schema
# and seed data. Safe to run repeatedly.
set -euo pipefail
cd "$(dirname "$0")/.."

PG_VERSION=16

# 1. System dependency: PostgreSQL server (idempotent).
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
fi

# 2. Start the cluster so we can prepare the database, then wait for readiness.
sudo pg_ctlcluster "$PG_VERSION" main start || true
for _ in $(seq 1 30); do
  if pg_isready -q -h 127.0.0.1 -p 5432; then break; fi
  sleep 1
done

# 3. Create the app role and database (idempotent).
sudo -u postgres psql -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ccr') THEN
    CREATE ROLE ccr LOGIN PASSWORD 'ccr';
  END IF;
END $$;
ALTER ROLE ccr CREATEDB;
SQL
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='ccr'" | grep -q 1; then
  sudo -u postgres createdb -O ccr ccr
fi

# 4. Local dev environment file (gitignored). Only created if missing so a
#    developer's own overrides are never clobbered.
if [ ! -f .env ]; then
  cat > .env <<'ENV'
# Local development environment for CCR website (Cloud Agent VM).
DATABASE_URL="postgresql://ccr:ccr@127.0.0.1:5432/ccr?schema=public"
AUTH_SECRET="dev-only-insecure-secret-do-not-use-in-production-0123456789abcdef"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
CCR_NODE_ORIGIN=""

# Seed account credentials (dev only, deterministic for local sign-in).
SEED_ADMIN_EMAIL="coolcaserepair@gmail.com"
SEED_ADMIN_PASSWORD="AdminDev123!"
SEED_STAFF_EMAIL="staff@ccr.local"
SEED_STAFF_PASSWORD="StaffDev123!"

# Optional integrations left blank in dev (quote emails fall back to var/outbox).
ANTHROPIC_API_KEY=""
GOOGLE_PLACES_API_KEY=""
GOOGLE_PLACE_ID="ChIJT_o9vItLkWsRgHNb73gMvOA"
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="CCR Cool Case Repair <coolcaserepair@gmail.com>"
POS_PROVIDER="mock"
LOYVERSE_API_TOKEN=""
ENV
fi

# 5. Node dependencies, Prisma client, schema and seed data.
npm ci
npx prisma generate
npx prisma migrate deploy
npm run db:seed

echo "CCR install complete."
