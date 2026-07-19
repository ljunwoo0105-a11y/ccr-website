import assert from "node:assert/strict";

type ColumnContract = { readonly name: string; readonly type: string; readonly nullable: boolean; readonly default?: string };
type IndexContract = { readonly name: string; readonly table: string; readonly columns: readonly string[]; readonly unique: boolean };
type ForeignKeyContract = {
  readonly name: string;
  readonly table: string;
  readonly columns: readonly string[];
  readonly referencesTable: string;
  readonly referencesColumns: readonly string[];
  readonly onDelete: string;
  readonly onUpdate: string;
};
type MigrationContract = {
  readonly tables: ReadonlyMap<string, readonly ColumnContract[]>;
  readonly addedColumns: ReadonlyMap<string, readonly ColumnContract[]>;
  readonly indexes: readonly IndexContract[];
  readonly foreignKeys: readonly ForeignKeyContract[];
};

const repairIntakeFields = fields("id String @id @default(cuid())|customerId String|customer Customer @relation(fields: [customerId], references: [id])|staffId String|staff User @relation(fields: [staffId], references: [id])|deviceType String|brand String|model String|imei String?|serialNo String?|repairTypes String|preCondition String|accessories String?|conditionNotes String?|partQuality String?|warrantyDays Int?|quotedPrice Float?|depositPaid Boolean @default(false)|status String @default(\"CHECKED_IN\")|customerSignature String?|matchedPartId String?|matchedPart Part? @relation(\"RepairIntakeMatchedPart\", fields: [matchedPartId], references: [id], onDelete: SetNull)|diagnosisRuleId String?|diagnosisRule DiagnosisRule? @relation(fields: [diagnosisRuleId], references: [id], onDelete: SetNull)|diagnosisCode String?|diagnosisLabel String?|diagnosisOutcome String?|pricingSource String @default(\"MANUAL\")|agreementSnapshot Json?|policyAcknowledgements Json?|agreementAcceptedAt DateTime?|preConditionAccuracyAccepted Boolean @default(false)|createdAt DateTime @default(now())|updatedAt DateTime @updatedAt|completedAt DateTime?");

const modelContracts = {
  RepairIntake: {
    fields: repairIntakeFields,
    attributes: fields("@@index([status])|@@index([customerId])|@@index([matchedPartId])|@@index([diagnosisRuleId])|@@index([agreementAcceptedAt])"),
  },
  DiagnosisRule: {
    fields: fields("id String @id @default(cuid())|deviceType String|brand String?|model String?|symptomCode String|symptomLabel String|repairType String|outcome String|priority Int @default(0)|active Boolean @default(true)|notes String?|createdAt DateTime @default(now())|updatedAt DateTime @updatedAt|intakes RepairIntake[]"),
    attributes: fields("@@index([deviceType, brand, model, active])|@@index([symptomCode, active])|@@index([repairType, active])"),
  },
  PolicyDocument: {
    fields: fields("id String @id @default(cuid())|category String|version String|title String|body String|active Boolean @default(true)|createdAt DateTime @default(now())|updatedAt DateTime @updatedAt"),
    attributes: fields("@@unique([category, version])|@@index([category, active])"),
  },
  PriceAccessLog: {
    fields: fields("id String @id @default(cuid())|userId String|user User @relation(fields: [userId], references: [id], onDelete: Restrict)|deviceType String?|brand String?|model String?|symptomCode String?|outcome String|matchedPartIds Json|ipHash String|userAgent String?|createdAt DateTime @default(now())"),
    attributes: fields("@@index([createdAt])|@@index([userId, createdAt])"),
  },
} as const;

const repairIntakeAddedColumns = [
  column("matchedPartId", "TEXT", true), column("diagnosisRuleId", "TEXT", true), column("diagnosisCode", "TEXT", true),
  column("diagnosisLabel", "TEXT", true), column("diagnosisOutcome", "TEXT", true), column("pricingSource", "TEXT", false, "'MANUAL'"),
  column("agreementSnapshot", "JSONB", true), column("policyAcknowledgements", "JSONB", true), column("agreementAcceptedAt", "TIMESTAMP(3)", true),
  column("preConditionAccuracyAccepted", "BOOLEAN", false, "false"),
] as const;

const tableContracts = {
  DiagnosisRule: [
    column("id", "TEXT", false), column("deviceType", "TEXT", false), column("brand", "TEXT", true), column("model", "TEXT", true),
    column("symptomCode", "TEXT", false), column("symptomLabel", "TEXT", false), column("repairType", "TEXT", false), column("outcome", "TEXT", false),
    column("priority", "INTEGER", false, "0"), column("active", "BOOLEAN", false, "true"), column("notes", "TEXT", true),
    column("createdAt", "TIMESTAMP(3)", false, "CURRENT_TIMESTAMP"), column("updatedAt", "TIMESTAMP(3)", false),
  ],
  PolicyDocument: [
    column("id", "TEXT", false), column("category", "TEXT", false), column("version", "TEXT", false), column("title", "TEXT", false),
    column("body", "TEXT", false), column("active", "BOOLEAN", false, "true"), column("createdAt", "TIMESTAMP(3)", false, "CURRENT_TIMESTAMP"),
    column("updatedAt", "TIMESTAMP(3)", false),
  ],
  PriceAccessLog: [
    column("id", "TEXT", false), column("userId", "TEXT", false), column("deviceType", "TEXT", true), column("brand", "TEXT", true),
    column("model", "TEXT", true), column("symptomCode", "TEXT", true), column("outcome", "TEXT", false), column("matchedPartIds", "JSONB", false),
    column("ipHash", "TEXT", false), column("userAgent", "TEXT", true), column("createdAt", "TIMESTAMP(3)", false, "CURRENT_TIMESTAMP"),
  ],
} as const;

const indexContracts = [
  index("RepairIntake_matchedPartId_idx", "RepairIntake", ["matchedPartId"]), index("RepairIntake_diagnosisRuleId_idx", "RepairIntake", ["diagnosisRuleId"]),
  index("RepairIntake_agreementAcceptedAt_idx", "RepairIntake", ["agreementAcceptedAt"]),
  index("DiagnosisRule_deviceType_brand_model_active_idx", "DiagnosisRule", ["deviceType", "brand", "model", "active"]),
  index("DiagnosisRule_symptomCode_active_idx", "DiagnosisRule", ["symptomCode", "active"]), index("DiagnosisRule_repairType_active_idx", "DiagnosisRule", ["repairType", "active"]),
  index("PolicyDocument_category_version_key", "PolicyDocument", ["category", "version"], true), index("PolicyDocument_category_active_idx", "PolicyDocument", ["category", "active"]),
  index("PriceAccessLog_createdAt_idx", "PriceAccessLog", ["createdAt"]), index("PriceAccessLog_userId_createdAt_idx", "PriceAccessLog", ["userId", "createdAt"]),
] as const;

const foreignKeyContracts = [
  foreignKey("RepairIntake_matchedPartId_fkey", "RepairIntake", ["matchedPartId"], "Part", ["id"], "SET NULL"),
  foreignKey("RepairIntake_diagnosisRuleId_fkey", "RepairIntake", ["diagnosisRuleId"], "DiagnosisRule", ["id"], "SET NULL"),
  foreignKey("PriceAccessLog_userId_fkey", "PriceAccessLog", ["userId"], "User", ["id"], "RESTRICT"),
] as const;

export function assertStaffPricingPrismaContract(schema: string, migration: string): void {
  assertSchemaContract(schema);
  assertMigrationContract(migration);
}

function assertSchemaContract(schema: string): void {
  for (const [modelName, contract] of Object.entries(modelContracts)) {
    const lines = modelLines(schema, modelName);
    assert.deepEqual(fieldLines(lines), contract.fields, `${modelName} field contract drifted`);
    assert.deepEqual(attributeLines(lines), contract.attributes, `${modelName} index/unique contract drifted`);
  }
  assert.ok(fieldLines(modelLines(schema, "Part")).includes("matchedIntakes RepairIntake[] @relation(\"RepairIntakeMatchedPart\")"), "Part relation drifted");
  assert.ok(fieldLines(modelLines(schema, "User")).includes("priceAccessLogs PriceAccessLog[]"), "User relation drifted");
}

function assertMigrationContract(migration: string): void {
  assert.doesNotMatch(migration, /\bDROP\b/i);
  assert.doesNotMatch(migration, /\bALTER\s+COLUMN\b/i);
  const contract = parseMigration(migration);
  assert.deepEqual(contract.addedColumns.get("RepairIntake"), repairIntakeAddedColumns, "RepairIntake SQL additions drifted");
  for (const [tableName, columns] of Object.entries(tableContracts)) {
    assert.deepEqual(contract.tables.get(tableName), columns, `${tableName} SQL columns drifted`);
  }
  assert.deepEqual(contract.indexes, indexContracts, "migration index contract drifted");
  assert.deepEqual(contract.foreignKeys, foreignKeyContracts, "migration foreign-key contract drifted");
}

function modelLines(schema: string, modelName: string): readonly string[] {
  const match = schema.match(new RegExp(`model ${modelName} \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match, `Missing model ${modelName}`);
  return match[1].split("\n").map(compactLine).filter((line) => line.length > 0 && !line.startsWith("//"));
}

function fieldLines(lines: readonly string[]): readonly string[] {
  return lines.filter((line) => !line.startsWith("@@"));
}

function attributeLines(lines: readonly string[]): readonly string[] {
  return lines.filter((line) => line.startsWith("@@"));
}

function compactLine(line: string): string {
  // Trim BEFORE stripping the comment: on a CRLF checkout the line ends in
  // "\r", and JS "." never matches a carriage return, so /\s+\/\/.*$/ could
  // not reach the end anchor and every commented field looked like drift.
  return line.trim().replace(/\s+\/\/.*$/, "").trim().replace(/\s+/g, " ");
}

function parseMigration(migration: string): MigrationContract {
  return { tables: parseCreateTables(migration), addedColumns: parseAddedColumns(migration), indexes: parseIndexes(migration), foreignKeys: parseForeignKeys(migration) };
}

function parseCreateTables(migration: string): ReadonlyMap<string, readonly ColumnContract[]> {
  const tables = new Map<string, readonly ColumnContract[]>();
  const tableRegex = /CREATE TABLE "([^"]+)" \(([\s\S]*?)\n\);/g;
  for (const match of migration.matchAll(tableRegex)) {
    tables.set(match[1], parseColumnLines(match[2]));
  }
  return tables;
}

function parseAddedColumns(migration: string): ReadonlyMap<string, readonly ColumnContract[]> {
  const grouped = new Map<string, ColumnContract[]>();
  const addColumnRegex = /ALTER TABLE "([^"]+)" ADD COLUMN "([^"]+)" ([^;]+);/g;
  for (const match of migration.matchAll(addColumnRegex)) {
    const columns = grouped.get(match[1]) ?? [];
    columns.push(parseColumnDefinition(match[2], match[3]));
    grouped.set(match[1], columns);
  }
  return grouped;
}

function parseColumnLines(block: string): readonly ColumnContract[] {
  return block.split("\n").map((line) => line.trim()).filter((line) => line.startsWith("\"")).map((line) => {
    const match = line.match(/^"([^"]+)"\s+(.+?),?$/);
    assert.ok(match, `Malformed column line ${line}`);
    return parseColumnDefinition(match[1], match[2].replace(/,$/, ""));
  });
}

function parseColumnDefinition(name: string, definition: string): ColumnContract {
  const match = definition.match(/^([A-Z]+(?:\(\d+\))?)( NOT NULL)?(?: DEFAULT (.+))?$/);
  assert.ok(match, `Malformed column definition ${name} ${definition}`);
  return column(name, match[1], match[2] === undefined, match[3]);
}

function parseIndexes(migration: string): readonly IndexContract[] {
  const indexRegex = /CREATE (UNIQUE )?INDEX "([^"]+)" ON "([^"]+)"\(([^)]+)\);/g;
  return [...migration.matchAll(indexRegex)].map((match) => index(match[2], match[3], parseQuotedList(match[4]), match[1] !== undefined));
}

function parseForeignKeys(migration: string): readonly ForeignKeyContract[] {
  const fkRegex = /ALTER TABLE "([^"]+)" ADD CONSTRAINT "([^"]+)" FOREIGN KEY \(([^)]+)\) REFERENCES "([^"]+)"\(([^)]+)\) ON DELETE ([A-Z ]+) ON UPDATE ([A-Z]+);/g;
  return [...migration.matchAll(fkRegex)].map((match) => foreignKey(match[2], match[1], parseQuotedList(match[3]), match[4], parseQuotedList(match[5]), match[6], match[7]));
}

function parseQuotedList(value: string): readonly string[] {
  return [...value.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

function fields(value: string): readonly string[] {
  return value.split("|");
}

function column(name: string, type: string, nullable: boolean, defaultValue?: string): ColumnContract {
  return defaultValue === undefined ? { name, type, nullable } : { name, type, nullable, default: defaultValue };
}

function index(name: string, table: string, columns: readonly string[], unique = false): IndexContract {
  return { name, table, columns, unique };
}

function foreignKey(
  name: string,
  table: string,
  columns: readonly string[],
  referencesTable: string,
  referencesColumns: readonly string[],
  onDelete: string,
  onUpdate = "CASCADE"
): ForeignKeyContract {
  return { name, table, columns, referencesTable, referencesColumns, onDelete, onUpdate };
}
