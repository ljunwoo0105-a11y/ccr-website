import pg from "pg";

const { Client } = pg;

const TABLES = [
  { name: "User", key: "id" },
  { name: "Part", key: "id" },
  { name: "QuoteRequest", key: "id" },
  { name: "Customer", key: "id" },
  { name: "DiagnosisRule", key: "id" },
  { name: "PolicyDocument", key: "id" },
  { name: "Review", key: "id" },
  { name: "AiModel", key: "id" },
  { name: "AiUsageLog", key: "id" },
  { name: "Setting", key: "key" },
  { name: "RepairIntake", key: "id" },
  { name: "PriceAccessLog", key: "id" },
  { name: "RepairForm", key: "id" },
  { name: "RepairFormItem", key: "id" },
];

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function parsedDatabaseUrl(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} is not a valid PostgreSQL URL.`);
  }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error(`${label} must use the PostgreSQL protocol.`);
  }
  return url;
}

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function clientFor(connectionString) {
  const hostname = new URL(connectionString).hostname;
  const local = hostname === "localhost" || hostname === "127.0.0.1";
  return new Client({
    connectionString,
    ssl: local ? false : { rejectUnauthorized: true },
    connectionTimeoutMillis: 15_000,
    query_timeout: 60_000,
  });
}

async function columnsFor(client, table) {
  const result = await client.query(
    `SELECT "column_name"
       FROM "information_schema"."columns"
      WHERE "table_schema" = 'public' AND "table_name" = $1
      ORDER BY "ordinal_position"`,
    [table],
  );
  return result.rows.map((row) => row.column_name);
}

function normalized(value) {
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return value.toString("hex");
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, normalized(value[key])]),
    );
  }
  return value;
}

function canonicalRows(rows) {
  return JSON.stringify(rows.map(normalized));
}

async function insertRows(client, table, columns, rows) {
  if (rows.length === 0) return;

  const maxParameters = 30_000;
  const rowsPerBatch = Math.max(1, Math.floor(maxParameters / columns.length));
  const quotedColumns = columns.map(quoteIdentifier).join(", ");

  for (let offset = 0; offset < rows.length; offset += rowsPerBatch) {
    const batch = rows.slice(offset, offset + rowsPerBatch);
    const values = [];
    const tuples = batch.map((row) => {
      const placeholders = columns.map((column) => {
        values.push(row[column]);
        return `$${values.length}`;
      });
      return `(${placeholders.join(", ")})`;
    });

    await client.query(
      `INSERT INTO ${quoteIdentifier(table)} (${quotedColumns})
       VALUES ${tuples.join(", ")}`,
      values,
    );
  }
}

const sourceConnectionString = requiredEnvironment("SOURCE_DATABASE_URL");
const targetConnectionString = requiredEnvironment("TARGET_DATABASE_URL");
const sourceUrl = parsedDatabaseUrl(sourceConnectionString, "SOURCE_DATABASE_URL");
const targetUrl = parsedDatabaseUrl(targetConnectionString, "TARGET_DATABASE_URL");

if (sourceConnectionString === targetConnectionString) {
  throw new Error("Source and target databases must be different.");
}
if (!targetUrl.hostname.endsWith(".neon.tech")) {
  throw new Error("The target must be the approved Neon database.");
}
if (process.env.ALLOW_TARGET_RESET !== "yes") {
  throw new Error("Set ALLOW_TARGET_RESET=yes to confirm the target may be reset.");
}

const source = clientFor(sourceConnectionString);
const target = clientFor(targetConnectionString);

try {
  await Promise.all([source.connect(), target.connect()]);
  console.info(
    `Migrating CCR data from ${sourceUrl.hostname} to ${targetUrl.hostname}.`,
  );

  const tableData = [];
  for (const { name, key } of TABLES) {
    const [sourceColumns, targetColumns] = await Promise.all([
      columnsFor(source, name),
      columnsFor(target, name),
    ]);
    if (sourceColumns.length === 0 || targetColumns.length === 0) {
      throw new Error(`Table ${name} is missing from the source or target.`);
    }
    if (sourceColumns.join("\0") !== targetColumns.join("\0")) {
      throw new Error(`Table ${name} has different source and target columns.`);
    }

    const orderBy = quoteIdentifier(key);
    const rows = (
      await source.query(
        `SELECT ${sourceColumns.map(quoteIdentifier).join(", ")}
           FROM ${quoteIdentifier(name)}
          ORDER BY ${orderBy}`,
      )
    ).rows;
    tableData.push({ name, key, columns: sourceColumns, rows });
  }

  await target.query("BEGIN");
  try {
    await target.query(
      `TRUNCATE ${TABLES.map(({ name }) => quoteIdentifier(name)).join(", ")}
       RESTART IDENTITY CASCADE`,
    );

    for (const { name, columns, rows } of tableData) {
      await insertRows(target, name, columns, rows);
      console.info(`${name}: copied ${rows.length} row(s).`);
    }

    for (const { name, key, columns, rows: sourceRows } of tableData) {
      const targetRows = (
        await target.query(
          `SELECT ${columns.map(quoteIdentifier).join(", ")}
             FROM ${quoteIdentifier(name)}
            ORDER BY ${quoteIdentifier(key)}`,
        )
      ).rows;

      if (canonicalRows(sourceRows) !== canonicalRows(targetRows)) {
        throw new Error(`Data verification failed for table ${name}.`);
      }
    }

    await target.query("COMMIT");
  } catch (error) {
    await target.query("ROLLBACK");
    throw error;
  }

  const totalRows = tableData.reduce((total, table) => total + table.rows.length, 0);
  console.info(
    `Migration complete: ${totalRows} row(s) across ${tableData.length} tables verified.`,
  );
} finally {
  await Promise.allSettled([source.end(), target.end()]);
}
