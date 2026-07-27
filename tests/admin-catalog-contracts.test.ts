import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const PART_ROUTE = "src/app/api/staff/parts/[id]/route.ts";
const ADMIN_LAYOUT = "src/app/admin/layout.tsx";
const ADMIN_NAV = "src/components/admin/admin-nav.tsx";
const PRICE_TABLE = "src/components/staff/PriceListTable.tsx";
const PART_CATALOG = "src/components/staff/PartCatalog.tsx";
const PART_CATALOG_API = "src/components/staff/part-catalog-api.ts";
const PART_CATALOG_SCHEMA = "src/components/staff/part-catalog-schema.ts";
const PART_CATALOG_TABLE = "src/components/staff/PartCatalogTable.tsx";
const STAFF_PRICE_PAGE = "src/app/staff/(portal)/price-list/page.tsx";
const ADMIN_CATALOG_PAGE = "src/app/admin/catalog/page.tsx";
const CATALOG_BOUNDARY_FILES = [
  PART_CATALOG,
  PART_CATALOG_API,
  PART_CATALOG_SCHEMA,
  PART_CATALOG_TABLE,
] as const;

function source(path: string): string {
  return readFileSync(path, "utf8");
}

function scriptKind(path: string): ts.ScriptKind {
  return path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

function sourceFile(path: string): ts.SourceFile {
  return sourceFileFromText(path, source(path));
}

function sourceFileFromText(path: string, text: string): ts.SourceFile {
  return ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, scriptKind(path));
}

function hasExport(node: ts.Node): boolean {
  const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
  return modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}

function exportedHandlers(file: ts.SourceFile): Map<string, ts.FunctionDeclaration> {
  const handlers = new Map<string, ts.FunctionDeclaration>();
  for (const statement of file.statements) {
    if (!ts.isFunctionDeclaration(statement) || !hasExport(statement)) continue;
    const name = statement.name?.text;
    if (name) handlers.set(name, statement);
  }
  return handlers;
}

function directReturnCall(functionNode: ts.FunctionDeclaration): string | null {
  for (const statement of functionNode.body?.statements ?? []) {
    if (
      ts.isReturnStatement(statement) &&
      statement.expression &&
      ts.isCallExpression(statement.expression) &&
      ts.isIdentifier(statement.expression.expression)
    ) {
      return statement.expression.expression.text;
    }
  }
  return null;
}

function assertionEscapeHatches(path: string, text = source(path)): readonly string[] {
  const file = sourceFileFromText(path, text);
  const violations: string[] = [];
  function visit(node: ts.Node): void {
    if (ts.isAsExpression(node) && node.type.getText(file) !== "const") {
      violations.push(`${path}: ${node.getText(file)}`);
    }
    if (ts.isTypeAssertionExpression(node)) {
      violations.push(`${path}: ${node.getText(file)}`);
    }
    if (ts.isNonNullExpression(node)) {
      violations.push(`${path}: ${node.getText(file)}`);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return violations;
}

test("part member mutation routes use the admin mutation wrapper", () => {
  const handlers = exportedHandlers(sourceFile(PART_ROUTE));

  assert.equal(directReturnCall(handlers.get("PATCH") ?? assert.fail("missing PATCH")), "runPartAdminMutation");
  assert.equal(directReturnCall(handlers.get("DELETE") ?? assert.fail("missing DELETE")), "runPartAdminMutation");
});

test("admin shell and nav expose responsive catalog destinations", () => {
  const layout = source(ADMIN_LAYOUT);
  const nav = source(ADMIN_NAV);

  assert.doesNotMatch(layout, /(?<!min-)h-screen/);
  assert.doesNotMatch(layout, /\bw-60\b/);
  assert.match(layout, /lg:sticky/);
  assert.match(layout, /overflow-x-hidden/);

  for (const label of [
    "Catalog & Pricing",
    "Diagnoses",
    "Policies",
    "Records",
    "Price Access",
  ]) {
    assert.match(nav, new RegExp(`label: "${label}"`));
  }
});

test("the console is the single catalog surface and manages parts", () => {
  // The staff portal folded into the console, so /admin/catalog is the only
  // page that renders the price list — there is no second read-only copy.
  assert.equal(existsSync(ADMIN_CATALOG_PAGE), true);
  assert.equal(existsSync(STAFF_PRICE_PAGE), false);
  assert.match(source(ADMIN_CATALOG_PAGE), /mode="admin"/);

  // The read-only mode remains available in the component contract even
  // though nothing renders it today.
  const table = `${source(PRICE_TABLE)}\n${source(PART_CATALOG)}`;
  assert.match(table, /mode: "admin" \| "staff"/);
  assert.match(table, /mode === "admin"/);
});

test("the merged nav carries the former staff portal sections", () => {
  // Workshop merged into the console dashboard; Quote Builder was removed.
  const nav = source(ADMIN_NAV);
  for (const label of [
    "Customer Intake",
    "Quote Leads",
    "Inventory",
  ]) {
    assert.match(nav, new RegExp(`label: "${label}"`));
  }
  // Nothing should link back out to a portal that no longer exists.
  assert.doesNotMatch(nav, /href: "\/staff/);
  assert.doesNotMatch(nav, /href="\/staff/);
});

test("catalog mutations surface failed responses before any reload", () => {
  const table = `${source(PART_CATALOG)}\n${source(PART_CATALOG_API)}`;

  assert.match(table, /setMutationError/);
  assert.match(table, /!response\.ok/);
  assert.doesNotMatch(table, /await fetch\(`\/api\/staff\/parts\/\$\{part\.id\}`[\s\S]{0,140}await load\(\)/);
});

test("catalog parser and consumers avoid assertion escape hatches at response boundaries", () => {
  // Given: the owned catalog parser and response-boundary consumers.
  const files = CATALOG_BOUNDARY_FILES;

  // When: their ASTs are scanned for ordinary assertions and non-null assertions.
  const violations = files.flatMap((file) => assertionEscapeHatches(file));

  // Then: response-boundary code has no assertion escape hatches.
  assert.deepEqual(violations, []);
});

test("catalog assertion contract detects inserted assertion escape hatches", () => {
  // Given: in-memory mutants containing each banned assertion form plus allowed as const.
  const mutant = `
    const raw: unknown = "OEM";
    const viaAs = raw as string;
    const viaTypeAssertion = <string>raw;
    const viaNonNull = viaAs!;
    const allowed = ["OEM", "AFTERMARKET"] as const;
  `;

  // When: the same AST helper scans the mutant source.
  const violations = assertionEscapeHatches("mutant.ts", mutant);

  // Then: all banned nodes are reported and the allowed const assertion is ignored.
  assert.deepEqual(violations, [
    "mutant.ts: raw as string",
    "mutant.ts: <string>raw",
    "mutant.ts: viaAs!",
  ]);
});
