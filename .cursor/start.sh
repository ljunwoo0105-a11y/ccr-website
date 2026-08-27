#!/usr/bin/env bash
# CCR website — Cloud Agent start (per-boot reconciliation).
# The database contents live on the build snapshot's disk; this only needs to
# (re)start the PostgreSQL process and confirm it is accepting connections.
set -euo pipefail

PG_VERSION=16

sudo pg_ctlcluster "$PG_VERSION" main start || true
for _ in $(seq 1 30); do
  if pg_isready -q -h 127.0.0.1 -p 5432; then
    echo "PostgreSQL is ready."
    exit 0
  fi
  sleep 1
done

echo "PostgreSQL did not become ready in time." >&2
exit 1
